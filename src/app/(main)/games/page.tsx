"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gamesApi, Game } from "@/lib/api/games";
import { getStorageUrl } from "@/lib/utils/image";
import FallbackImage from "@/components/ui/FallbackImage";

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Game[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await gamesApi.getAllGames();
                setGames(data);
            } catch (err) {
                // error silently handled
            } finally {
                setIsLoading(false);
            }
        };
        fetchGames();
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        // Client-side filter first (instant)
        const q = searchQuery.toLowerCase();
        const localMatches = games.filter(g => g.name.toLowerCase().includes(q));
        setSearchResults(localMatches);

        // If query is 2+ chars, also search API for games not yet loaded
        if (searchQuery.trim().length >= 2) {
            const timer = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const apiResults = await gamesApi.searchGames(searchQuery.trim());
                    // Merge: API results + local matches (deduplicated)
                    const existingIds = new Set(localMatches.map(g => g.id));
                    const merged = [...localMatches];
                    for (const r of apiResults) {
                        if (!existingIds.has(r.id)) {
                            merged.push(r);
                        }
                    }
                    setSearchResults(merged);
                } catch {
                    // Keep local results on API error
                } finally {
                    setIsSearching(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, games]);

    const displayedGames = searchResults !== null ? searchResults : games;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-3">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                        Browse
                    </div>
                    <h1 className="heading-base text-xl md:text-2xl">Roblox Games</h1>
                    <p className="text-xs text-offgray-500">Discover scripts for your favorite Roblox experiences</p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearching ? (
                            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                        )}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search games..."
                        className="w-full h-9 pl-9 pr-8 bg-[#0d0f11] border border-white/[0.06] rounded-lg text-sm text-offgray-100 placeholder:text-offgray-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-offgray-600 hover:text-offgray-300 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </section>

            {/* Results count when searching */}
            {searchQuery && (
                <div className="text-[11px] text-offgray-500 font-mono">
                    {displayedGames.length} game{displayedGames.length !== 1 ? 's' : ''} found for &quot;{searchQuery}&quot;
                </div>
            )}

            {/* Games Grid */}
            <section>
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {[...Array(18)].map((_, i) => (
                            <div key={i} className="rounded-lg overflow-hidden bg-white/[0.02] animate-pulse border border-white/[0.04]">
                                <div className="aspect-video" />
                                <div className="p-2.5 space-y-1.5">
                                    <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
                                    <div className="h-2.5 w-1/3 bg-white/[0.03] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedGames.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {displayedGames.map((game) => (
                            <Link
                                key={game.id}
                                href={`/g/${game.slug}`}
                                className="group relative flex flex-col bg-[#0d0f11] border border-white/[0.04] rounded-lg overflow-hidden hover:border-emerald-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/[0.03]"
                            >
                                {/* Thumbnail — native Roblox 16:9 */}
                                <div className="relative aspect-video overflow-hidden bg-[#080a0c]">
                                    {game.bannerUrl ? (
                                        <FallbackImage
                                            src={getStorageUrl(game.bannerUrl)}
                                            alt={game.name}
                                            fill
                                            iconType="game"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                                        />
                                    ) : game.logoUrl ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#11141A] to-[#080a0c]">
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.06] shadow-xl">
                                                <FallbackImage
                                                    src={getStorageUrl(game.logoUrl)}
                                                    alt={game.name}
                                                    fill
                                                    iconType="game"
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#11141A] to-[#080a0c]">
                                            <span className="text-3xl font-bold text-white/[0.04] select-none">{game.name.charAt(0)}</span>
                                        </div>
                                    )}

                                    {/* Subtle bottom fade */}
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d0f11] to-transparent pointer-events-none" />

                                    {/* Game icon badge */}
                                    {game.logoUrl && game.bannerUrl && (
                                        <div className="absolute bottom-1.5 left-2 w-7 h-7 rounded-md border border-white/[0.08] overflow-hidden shadow-lg bg-black/40 backdrop-blur-sm">
                                            <FallbackImage
                                                src={getStorageUrl(game.logoUrl)}
                                                alt=""
                                                fill
                                                iconType="game"
                                                className="object-cover"
                                                sizes="28px"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="px-2.5 py-2 space-y-0.5">
                                    <h3 className="text-[11px] font-semibold text-offgray-100 truncate leading-tight group-hover:text-emerald-400 transition-colors">
                                        {game.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-[9px] text-offgray-600">
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        {game.scriptCount || 0} script{(game.scriptCount || 0) !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                        </div>
                        <p className="text-sm text-offgray-400">No games found for &quot;{searchQuery}&quot;</p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
