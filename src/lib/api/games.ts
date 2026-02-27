import apiClient, { handleApiError } from './client';
import { mapScriptData } from './scripts';

export interface Game {
    id: string;
    name: string;
    gamePlatformId?: string;
    platform: string;
    logoUrl?: string;
    bannerUrl?: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    scriptCount?: number;
    scripts?: import('./scripts').Script[];
}

export interface GameLookupResult {
    name: string;
    game_platform_id: string;
    platform: string;
    logo_url?: string;
    banner_url?: string;
    creator?: string;
    playing?: number;
    visits?: number;
    id?: string;
    slug?: string;
}

const mapGame = (data: any): Game => ({
    id: data.id,
    name: data.name,
    gamePlatformId: data.game_platform_id || data.gamePlatformId,
    platform: data.platform,
    logoUrl: data.logo_url || data.logoUrl,
    bannerUrl: data.banner_url || data.bannerUrl,
    slug: data.slug,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    scriptCount: data.script_count ?? data.scriptCount ?? 0,
    scripts: data.scripts ? data.scripts.map(mapScriptData) : undefined,
});

export const searchGames = async (query: string): Promise<Game[]> => {
    try {
        const response = await apiClient.get(`/games/search?q=${encodeURIComponent(query)}`);
        return response.data.data.map(mapGame);
    } catch (error) {
        throw handleApiError(error);
    }
};

export const getAllGames = async (): Promise<Game[]> => {
    try {
        const response = await apiClient.get('/games');
        return response.data.data.map(mapGame);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Extract Roblox game/place ID from various URL formats.
 * Supports: /games/ID, /id/games/ID, /es/games/ID, universes/ID, pure numbers
 */
const extractRobloxId = (input: string): string => {
    const trimmed = input.trim();

    // Pure number — already a game ID
    if (/^\d+$/.test(trimmed)) return trimmed;

    // Standard or locale-prefixed game URL: /games/12345 or /id/games/12345
    const gameMatch = trimmed.match(/roblox\.com\/(?:[a-z]{2}\/)?games\/(\d+)/i);
    if (gameMatch) return gameMatch[1];

    // Universe URL: /universes/12345
    const universeMatch = trimmed.match(/universes\/(\d+)/i);
    if (universeMatch) return universeMatch[1];

    // Share link — pass through as-is for backend to resolve
    if (/roblox\.com\/share\?/i.test(trimmed) || /ro\.blox\.com\//i.test(trimmed)) {
        return trimmed;
    }

    // Fallback: return as-is
    return trimmed;
};

export const lookupGame = async (query: string): Promise<{ data: GameLookupResult; source: string }> => {
    try {
        const cleanQuery = extractRobloxId(query);
        const response = await apiClient.get(`/games/lookup?q=${encodeURIComponent(cleanQuery)}`);
        return { data: response.data.data, source: response.data.source };
    } catch (error) {
        throw handleApiError(error);
    }
};

export const getGameBySlug = async (slug: string): Promise<Game> => {
    try {
        const response = await apiClient.get(`/games/slug/${slug}`);
        return mapGame(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

export const gamesApi = {
    searchGames,
    getAllGames,
    lookupGame,
    getGameBySlug,
};

export default gamesApi;
