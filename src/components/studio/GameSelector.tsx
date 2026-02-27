"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import FallbackImage from "@/components/ui/FallbackImage";
import { gamesApi, Game } from "@/lib/api/games";

interface GameSelectorProps {
    value?: string;
    onChange: (gamePlatformId: string) => void;
    error?: string;
    initialGamePreview?: {
        name: string;
        logo_url?: string;
        banner_url?: string;
        game_platform_id?: string;
        creator?: string;
        playing?: number;
        visits?: number;
    } | null;
}

export function GameSelector({ value, onChange, error, initialGamePreview }: GameSelectorProps) {
    const [gameMode, setGameMode] = useState<"search" | "link">("search");
    const [gameSearch, setGameSearch] = useState("");
    const [gameResults, setGameResults] = useState<Game[]>([]);
    const [showGameDropdown, setShowGameDropdown] = useState(false);
    const [gameSearchLoading, setGameSearchLoading] = useState(false);
    const [searchDone, setSearchDone] = useState(false);
    const gameRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Game Link Lookup State
    const [gameLinkInput, setGameLinkInput] = useState("");
    const [gameLookupLoading, setGameLookupLoading] = useState(false);
    const [gameLookupError, setGameLookupError] = useState<string | null>(null);
    const lookupTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Selected Game Preview
    const [selectedGamePreview, setSelectedGamePreview] = useState<{
        name: string;
        logo_url?: string;
        banner_url?: string;
        game_platform_id?: string;
        creator?: string;
        playing?: number;
        visits?: number;
    } | null>(initialGamePreview || null);

    // Sync initial preview if provided (for edit page)
    useEffect(() => {
        if (initialGamePreview) {
            setSelectedGamePreview(initialGamePreview);
        }
    }, [initialGamePreview]);

    // Format visits
    const formatVisits = (visits: number) => {
        if (visits >= 1e9) return `${(visits / 1e9).toFixed(1)}B`;
        if (visits >= 1e6) return `${(visits / 1e6).toFixed(1)}M`;
        if (visits >= 1e3) return `${(visits / 1e3).toFixed(1)}K`;
        return visits.toLocaleString();
    };

    // --- Game Search Logic ---
    const handleGameSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setGameResults([]);
            setSearchDone(false);
            return;
        }
        setGameSearchLoading(true);
        setSearchDone(false);
        try {
            const results = await gamesApi.searchGames(query);
            setGameResults(results);
        } catch {
            setGameResults([]);
        } finally {
            setGameSearchLoading(false);
            setSearchDone(true);
        }
    }, []);

    const onGameSearchChange = (value: string) => {
        setGameSearch(value);
        setShowGameDropdown(true);
        setSearchDone(false);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (value.length >= 2) {
            searchTimerRef.current = setTimeout(() => handleGameSearch(value), 400);
        } else {
            setGameResults([]);
        }
    };

    const handleSelectGame = (game: Game) => {
        // Set base data immediately
        setSelectedGamePreview({
            name: game.name,
            logo_url: game.logoUrl,
            banner_url: game.bannerUrl,
            game_platform_id: game.gamePlatformId,
        });
        onChange(game.gamePlatformId || "");
        setShowGameDropdown(false);
        setGameSearch("");

        // Trigger lookup to fetch real-time stats (players/visits)
        // SKIPPED: lookupGame treats numbers as PlaceIDs, but gamePlatformId is a UniverseID.
        // This causes it to find the wrong game if the UniverseID happens to match a valid PlaceID.
        // Since we selected from search (DB), we trust the data is correct enough.
        /* if (game.gamePlatformId) {
            lookupGame(game.gamePlatformId);
        } */
    };

    // Click outside to close components
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (gameRef.current && !gameRef.current.contains(e.target as Node)) {
                setShowGameDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Game Link Lookup Logic ---
    const lookupGame = useCallback(async (input: string) => {
        if (!input || input.trim().length < 3) {
            setGameLookupError(null);
            return;
        }
        setGameLookupLoading(true);
        setGameLookupError(null);
        try {
            const result = await gamesApi.lookupGame(input.trim());
            setSelectedGamePreview({
                name: result.data.name,
                logo_url: result.data.logo_url,
                banner_url: result.data.banner_url,
                game_platform_id: result.data.game_platform_id,
                creator: result.data.creator,
                playing: result.data.playing,
                visits: result.data.visits,
            });
            onChange(result.data.game_platform_id);
        } catch (err: any) {
            setGameLookupError(err.message || "Game not found on Roblox");
        } finally {
            setGameLookupLoading(false);
        }
    }, [onChange]);

    const handleGameLinkChange = (value: string) => {
        setGameLinkInput(value);
        setGameLookupError(null);
        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = setTimeout(() => lookupGame(value), 800);
    };

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
    }, []);

    const handleClearGame = () => {
        setSelectedGamePreview(null);
        onChange("");
        setGameSearch("");
        setGameLinkInput("");
        setGameLookupError(null);
        setSearchDone(false);
        setGameMode("search");
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-wider">Game *</label>

            {/* ── Selected Game Preview Card ── */}
            {selectedGamePreview ? (
                <div className="relative rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden animate-fade-slide-in">
                    {/* Absolute × button in top-right corner */}
                    <button
                        type="button"
                        onClick={handleClearGame}
                        className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.1] text-offgray-400 hover:text-red-400 hover:bg-black/70 transition-all"
                        title="Remove game"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" x2="6" y1="6" y2="18" />
                            <line x1="6" x2="18" y1="6" y2="18" />
                        </svg>
                    </button>

                    {/* Banner */}
                    {selectedGamePreview.banner_url && (
                        <div className="relative w-full h-[100px]">
                            <FallbackImage src={selectedGamePreview.banner_url} alt={selectedGamePreview.name} fill iconType="game" className="object-cover" unoptimized sizes="(max-width: 768px) 100vw, 300px" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f11] via-[#0d0f11]/30 to-transparent" />
                        </div>
                    )}
                    {/* Info */}
                    <div className={`flex items-start gap-3 px-4 ${selectedGamePreview.banner_url ? '-mt-5 pb-3' : 'py-3'} relative z-10`}>
                        {selectedGamePreview.logo_url && (
                            <div className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-[#0d0f11] shadow-lg ring-1 ring-white/[0.06] ${selectedGamePreview.banner_url ? '-mt-4' : ''}`}>
                                <FallbackImage src={selectedGamePreview.logo_url} alt="" fill iconType="game" className="object-cover" unoptimized />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="text-[14px] font-semibold text-white truncate leading-tight pr-6">{selectedGamePreview.name}</h4>
                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                                {selectedGamePreview.creator && (
                                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-offgray-400">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        {selectedGamePreview.creator}
                                    </span>
                                )}
                                {selectedGamePreview.playing !== undefined && selectedGamePreview.playing > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {selectedGamePreview.playing.toLocaleString()} playing
                                    </span>
                                )}
                                {selectedGamePreview.visits !== undefined && selectedGamePreview.visits > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-offgray-500">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        {formatVisits(selectedGamePreview.visits)} visits
                                    </span>
                                )}
                                {gameLookupLoading && !selectedGamePreview.playing && !selectedGamePreview.visits && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-offgray-600">
                                        <span className="w-3 h-3 border border-offgray-600/30 border-t-offgray-500 rounded-full animate-spin" />
                                        Syncing stats...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                /* ── Lookup Loading Skeleton ── */
            ) : gameLookupLoading ? (
                <div className="rounded-xl border border-white/[0.06] bg-surface-panel overflow-hidden animate-fade-slide-in">
                    {/* Skeleton banner */}
                    <div className="w-full h-[100px] skeleton-shimmer" />
                    <div className="flex items-start gap-3 px-4 -mt-5 pb-3 relative z-10">
                        <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0 border-2 border-[#0d0f11] -mt-4" />
                        <div className="flex-1 pt-2 space-y-2">
                            <div className="w-48 h-3.5 rounded skeleton-shimmer" />
                            <div className="w-32 h-2.5 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="px-4 pb-3">
                        <span className="text-[10px] text-offgray-600 flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin inline-block" />
                            Fetching info...
                        </span>
                    </div>
                </div>

                /* ── Input Mode ── */
            ) : (
                <>
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-0.5 p-0.5 mb-2 bg-white/[0.03] rounded-lg w-fit border border-white/[0.04]">
                        <button
                            type="button"
                            onClick={() => setGameMode("search")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${gameMode === "search"
                                ? "bg-white/[0.1] text-white shadow-sm"
                                : "text-offgray-500 hover:text-offgray-300"
                                }`}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>
                                Search
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGameMode("link")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${gameMode === "link"
                                ? "bg-white/[0.1] text-white shadow-sm"
                                : "text-offgray-500 hover:text-offgray-300"
                                }`}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                Link
                            </span>
                        </button>
                    </div>

                    {/* Search Mode */}
                    {gameMode === "search" && (
                        <div ref={gameRef} className="relative">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-offgray-600 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>
                                <input
                                    type="text"
                                    value={gameSearch}
                                    onChange={(e) => onGameSearchChange(e.target.value)}
                                    onFocus={() => gameSearch.length >= 2 && setShowGameDropdown(true)}
                                    className={`w-full h-9 pl-9 pr-9 bg-white/[0.02] border rounded-lg text-sm text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all ${error
                                        ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                                        : "border-white/[0.06] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                                        }`}
                                    placeholder="Search for a game..."
                                />
                                {gameSearchLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showGameDropdown && gameSearch.length >= 2 && (
                                <div className="absolute z-20 mt-1.5 w-full bg-[#181b1f] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-fade-slide-in">
                                    {gameSearchLoading ? (
                                        <div className="p-2 space-y-1">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                                                    <div className="w-8 h-8 rounded-md skeleton-shimmer shrink-0" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="w-24 h-3 rounded skeleton-shimmer" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : gameResults.length > 0 ? (
                                        <div className="p-1 max-h-56 overflow-y-auto">
                                            {gameResults.map((game) => (
                                                <button
                                                    key={game.id}
                                                    type="button"
                                                    onClick={() => handleSelectGame(game)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left group"
                                                >
                                                    {game.logoUrl ? (
                                                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/[0.06] group-hover:border-emerald-500/30 transition-colors">
                                                            <FallbackImage src={game.logoUrl} alt="" fill iconType="game" className="object-cover" unoptimized />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] shrink-0 flex items-center justify-center border border-white/[0.06]">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-offgray-600"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /></svg>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-offgray-200 group-hover:text-white truncate transition-colors font-medium">{game.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : searchDone ? (
                                        <div className="px-4 py-4 text-center">
                                            <p className="text-xs text-offgray-500 mb-2">No games found.</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGameMode("link");
                                                    setShowGameDropdown(false);
                                                }}
                                                className="text-[10px] text-emerald-400 hover:underline"
                                            >
                                                Try linking via URL instead
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Link Mode */}
                    {gameMode === "link" && (
                        <div className="animate-fade-slide-in">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-offgray-600 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                <input
                                    type="text"
                                    value={gameLinkInput}
                                    onChange={(e) => handleGameLinkChange(e.target.value)}
                                    className={`w-full h-9 pl-9 pr-3 bg-white/[0.02] border rounded-lg text-sm text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all ${gameLookupError
                                        ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                                        : "border-white/[0.06] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                                        }`}
                                    placeholder="Paste Roblox game URL..."
                                    autoFocus
                                />
                            </div>
                            {gameLookupError && (
                                <p className="mt-1.5 text-[10px] text-red-400 flex items-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" /></svg>
                                    {gameLookupError}
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
            {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
        </div>
    );
}

