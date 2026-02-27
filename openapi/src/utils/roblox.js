import logger from "./logger.js";

const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch with timeout helper
 */
const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

/**
 * Extract Place ID from various Roblox game inputs:
 * - Pure number: "2753915549"
 * - Standard game URL: "https://www.roblox.com/games/2753915549/..."
 * - Share link: "https://www.roblox.com/share?code=...&type=ExperienceDetails..."
 * Returns { type, value } or null
 */
export const parseRobloxInput = (input) => {
    if (!input) return null;

    const trimmed = input.trim();

    // Pure number — treat as place ID
    if (/^\d+$/.test(trimmed)) {
        return { type: "placeId", value: trimmed };
    }

    // Standard game URL: /games/12345/game-name (with optional locale prefix like /id/, /es/, /fr/)
    const gameUrlMatch = trimmed.match(/roblox\.com\/(?:[a-z]{2}\/)?games\/(\d+)/i);
    if (gameUrlMatch) {
        return { type: "placeId", value: gameUrlMatch[1] };
    }

    // Share link: /share?code=xxx&type=ExperienceDetails
    const shareMatch = trimmed.match(/roblox\.com\/share\?/i) || trimmed.match(/ro\.blox\.com\//i);
    if (shareMatch) {
        return { type: "shareLink", value: trimmed };
    }

    return null;
};

/**
 * Resolve a share link to a place ID by following the redirect
 * Roblox share links redirect to the actual game page
 */
export const resolveShareLink = async (shareUrl) => {
    try {
        // Fetch the share link — it will redirect to the game page
        const res = await fetchWithTimeout(shareUrl, {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        if (!res.ok) {
            logger.warn("Roblox share link request failed with status %d: %s", res.status, res.statusText);
            return null;
        }

        const finalUrl = res.url;
        logger.info("Share link resolved to: %s", finalUrl);

        // Extract place ID from the final URL
        const match = finalUrl.match(/roblox\.com\/games\/(\d+)/i);
        if (match) {
            return match[1];
        }

        // Handle deep link params often found in ro.blox.com redirects
        // e.g. ...&af_dp=roblox%3A%2F%2Fnavigation%2Fgame_details%2FgameId%3D6701277882...
        const urlObj = new URL(finalUrl);
        const afDp = urlObj.searchParams.get("af_dp");
        if (afDp) {
            const decoded = decodeURIComponent(afDp);
            const gameIdMatch = decoded.match(/gameId%3D(\d+)/i) || decoded.match(/gameId=(\d+)/i);
            if (gameIdMatch) {
                return gameIdMatch[1];
            }
        }

        // If not in URL, try to extract from HTML content
        const html = await res.text();

        // Look for data-placeid or game ID in the HTML
        const placeIdMatch = html.match(/data-place-id="(\d+)"/i) ||
            html.match(/\"placeId\":(\d+)/i) ||
            html.match(/\"rootPlaceId\":(\d+)/i) ||
            html.match(/games\/(\d+)/i);

        if (placeIdMatch) {
            return placeIdMatch[1];
        }

        logger.warn("Could not extract place ID from share link: %s", shareUrl);
        return null;
    } catch (error) {
        logger.error("Failed to resolve share link %s: %o", shareUrl, error);
        return null;
    }
};

/**
 * Get Universe ID from a Place ID
 */
export const getUniverseIdFromPlaceId = async (placeId) => {
    try {
        const res = await fetchWithTimeout(
            `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.universeId ? String(data.universeId) : null;
    } catch (error) {
        logger.error("Failed to get universe ID for place %s: %o", placeId, error);
        return null;
    }
};

/**
 * Fetch game details from Roblox API using Universe ID
 */
export const fetchRobloxGameDetails = async (universeId) => {
    try {
        const res = await fetchWithTimeout(
            `https://games.roblox.com/v1/games?universeIds=${universeId}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.data || data.data.length === 0) return null;

        const game = data.data[0];
        return {
            name: game.name,
            description: game.description,
            universeId: String(game.id),
            placeId: game.rootPlaceId ? String(game.rootPlaceId) : null,
            creator: game.creator?.name || null,
            playing: game.playing || 0,
            visits: game.visits || 0,
        };
    } catch (error) {
        logger.error("Failed to fetch Roblox game details for universe %s: %o", universeId, error);
        return null;
    }
};

/**
 * Fetch game icon from Roblox API
 */
export const fetchRobloxGameIcon = async (universeId) => {
    try {
        const res = await fetchWithTimeout(
            `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.data || data.data.length === 0) return null;
        return data.data[0]?.imageUrl || null;
    } catch (error) {
        logger.error("Failed to fetch Roblox game icon for %s: %o", universeId, error);
        return null;
    }
};

/**
 * Fetch game thumbnail from Roblox API
 */
export const fetchRobloxGameThumbnail = async (universeId) => {
    try {
        const res = await fetchWithTimeout(
            `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.data || data.data.length === 0) return null;
        const thumbs = data.data[0]?.thumbnails;
        if (!thumbs || thumbs.length === 0) return null;
        return thumbs[0]?.imageUrl || null;
    } catch (error) {
        logger.error("Failed to fetch Roblox game thumbnail for %s: %o", universeId, error);
        return null;
    }
};

/**
 * Full Roblox game lookup: takes a game ID, URL, or share link
 * Returns game details + images, or null if invalid
 */
export const lookupRobloxGame = async (input) => {
    const parsed = parseRobloxInput(input);
    if (!parsed) return null;

    let placeId = null;

    if (parsed.type === "shareLink") {
        // Resolve share link to place ID first
        placeId = await resolveShareLink(parsed.value);
        if (!placeId) {
            logger.warn("Could not resolve share link: %s", input);
            return null;
        }
    } else {
        placeId = parsed.value;
    }

    // Get universe ID from place ID
    let universeId = await getUniverseIdFromPlaceId(placeId);

    // If that fails, the input might itself be a universe ID — try directly
    if (!universeId) {
        const details = await fetchRobloxGameDetails(placeId);
        if (details) {
            universeId = details.universeId;
        }
    }

    if (!universeId) {
        logger.warn("Could not resolve Roblox game for input: %s", input);
        return null;
    }

    // Fetch all data in parallel
    const [details, iconUrl, thumbnailUrl] = await Promise.all([
        fetchRobloxGameDetails(universeId),
        fetchRobloxGameIcon(universeId),
        fetchRobloxGameThumbnail(universeId),
    ]);

    if (!details) return null;

    return {
        name: details.name,
        description: details.description,
        universeId,
        placeId: details.placeId || placeId,
        creator: details.creator,
        playing: details.playing,
        visits: details.visits,
        iconUrl,
        thumbnailUrl,
    };
};
