"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import { ScriptCard } from "@/components/home/ScriptCard";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { formatRelativeTime } from "@/lib/utils/date";
import apiClient from "@/lib/api/client";
import ScrollToTop from "@/components/ui/ScrollToTop";
import AmbientLightning from "@/components/home/AmbientLightning";

/** Format a number into a compact human-readable string (e.g. 1.2K, 3.5M) */
function formatCompact(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
}

interface PlatformStats {
    scripts: number;
    developers: number;
    deployments: number;
    games: number;
    hubs: number;
}

const SCRIPTS_PER_PAGE = 30; // ~6 rows of 5 columns

export default function HomePage() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Generate a consistent random seed for this session's pagination
    const [seed] = useState(() => Math.random().toString(36).substring(7));

    // Sentinel ref for infinite scroll
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Initial data load
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [scriptsRes, statsRes] = await Promise.all([
                    scriptsApi.getAllScripts({ sortBy: 'random', seed, page: 1, limit: SCRIPTS_PER_PAGE }),
                    apiClient.get('/stats'),
                ]);
                setScripts(scriptsRes.scripts);
                setHasMore(scriptsRes.pagination.hasMore);
                setTotal(scriptsRes.pagination.total);
                setPage(1);
                setStats(statsRes.data.data);
            } catch (err: any) {
                // error silently handled
                setError("Failed to load scripts. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Load more scripts
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const result = await scriptsApi.getAllScripts({ sortBy: 'random', seed, page: nextPage, limit: SCRIPTS_PER_PAGE });
            setScripts(prev => [...prev, ...result.scripts]);
            setHasMore(result.pagination.hasMore);
            setPage(nextPage);
        } catch (err) {
            // error silently handled
        } finally {
            setIsLoadingMore(false);
        }
    }, [page, hasMore, isLoadingMore]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            { rootMargin: '400px' } // Start loading 400px before the sentinel is visible
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoadingMore, isLoading]);

    // Real-time stats polling
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const statsRes = await apiClient.get('/stats');
                setStats(statsRes.data.data);
            } catch (err) {
                // error silently handled
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const displayStats = [
        { value: stats ? stats.scripts.toLocaleString() : '—', label: 'Scripts' },
        { value: stats ? stats.developers.toLocaleString() : '—', label: 'Developers' },
        { value: stats ? stats.deployments.toLocaleString() : '—', label: 'Views' },
        { value: stats ? stats.hubs.toLocaleString() : '—', label: 'Hubs' },
    ];

    return (
        <div className="space-y-12">
            {/* Hero */}
            <section className="space-y-6 relative">
                <AmbientLightning />
                {/* Title + Subtitle */}
                <div className="space-y-3 pt-2">
                    <h1 className="heading-base text-3xl md:text-[40px] leading-tight">
                        Script<span className="text-emerald-400">Hub</span>
                    </h1>
                    <p className="text-sm md:text-[15px] text-offgray-400 max-w-lg leading-relaxed">
                        The largest community-driven library for <span className="text-emerald-400">Lua</span> scripts. <br className="hidden sm:block" />
                        Discover working scripts, share your creations, and dominate your favorite games.
                    </p>
                </div>

                {/* Search */}
                <SearchBar />

                {/* Stats bar */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
                    {displayStats.map((stat, i) => (
                        <div key={stat.label} className="flex items-center gap-1 md:gap-6">
                            <div>
                                <span className="text-[10px] sm:text-base md:text-lg font-medium text-offgray-50 font-mono tabular-nums">{stat.value}</span>
                                <span className="text-[9px] sm:text-xs text-offgray-600 ml-0.5 md:ml-1.5">{stat.label}</span>
                            </div>
                            {i < displayStats.length - 1 && <div className="hidden sm:block w-px h-3 md:h-4 bg-border-subtle" />}
                            {/* Mobile separator (bullet) */}
                            {i < displayStats.length - 1 && <div className="sm:hidden w-0.5 h-0.5 rounded-full bg-offgray-700 mx-0.5" />}
                        </div>
                    ))}
                    <div className="flex items-center gap-1 text-[9px] sm:text-xs text-offgray-500 pt-0 sm:ml-4 sm:border-l sm:border-white/[0.04] sm:pl-4">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </div>
                </div>
            </section>

            {/* Recent Scripts — grid */}
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="heading-base text-xl">Recent Scripts</h2>
                        <p className="text-xs text-offgray-600 mt-1">
                            Latest uploads from the community
                            {total > 0 && <span className="text-offgray-700 ml-1.5">· {total.toLocaleString()} total</span>}
                        </p>
                    </div>
                    <a
                        href="/trending"
                        className="
              text-xs font-medium text-offgray-300
              bg-surface-panel border border-border-subtle rounded-md
              px-3.5 py-2
              hover:border-offgray-700 hover:text-offgray-50
              transition-colors duration-100
            "
                    >
                        View all
                    </a>
                </div>

                {/* Responsive grid */}
                <div className="min-h-[200px]">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {[...Array(SCRIPTS_PER_PAGE)].map((_, i) => (
                                <div key={i} className="rounded-lg overflow-hidden bg-white/[0.02] animate-pulse border border-white/[0.04]">
                                    <div className="aspect-video" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
                                        <div className="h-2.5 w-1/2 bg-white/[0.03] rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-400 text-sm bg-red-500/5 rounded-xl border border-red-500/10">
                            {error}
                        </div>
                    ) : scripts.length === 0 ? (
                        <div className="text-center py-10 text-offgray-500 text-sm bg-surface-panel/50 rounded-xl border border-white/[0.04]">
                            No scripts found. Be the first to upload one!
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {scripts.map((script) => (
                                    <ScriptCard
                                        key={script.id}
                                        id={script.id}
                                        title={script.title}
                                        game={script.gameName || "Unknown Game"}
                                        stars={script.views}
                                        statType="views"
                                        timeAgo={formatRelativeTime(script.createdAt)}
                                        color="#14291e"
                                        href={`/s/${script.slug}`}
                                        gameSlug={script.gameSlug}
                                        thumbnailUrl={script.thumbnailUrl}
                                        gameLogoUrl={script.gameLogoUrl}
                                        fallbackType="icon"
                                        isLiked={script.isLiked}
                                        isPaid={script.isPaid}
                                        hasKeySystem={script.hasKeySystem}
                                    />
                                ))}
                            </div>

                            {/* Loading more indicator */}
                            {isLoadingMore && (
                                <div className="flex items-center justify-center py-8 gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-500" />
                                    <span className="text-xs text-offgray-500">Loading more scripts...</span>
                                </div>
                            )}

                            {/* Infinite scroll sentinel */}
                            {hasMore && <div ref={sentinelRef} className="h-1" />}

                            {/* End of list */}
                            {!hasMore && scripts.length > SCRIPTS_PER_PAGE && (
                                <div className="text-center py-6 text-[11px] text-offgray-600">
                                    You&apos;ve reached the end · {scripts.length} scripts loaded
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <ScrollToTop />
        </div>
    );
}
