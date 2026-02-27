"use client";

import { useState, useEffect } from "react";
import { ScriptCard } from "@/components/home/ScriptCard";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { formatRelativeTime } from "@/lib/utils/date";
import apiClient from "@/lib/api/client";

const TIME_FILTERS = [
    { label: "Today", value: "today" },
    { label: "This week", value: "week" },
    { label: "This month", value: "month" },
    { label: "All time", value: "all" },
];

// Map raw API response to Script type
function mapScriptResponse(data: any): Script {
    return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
        loaderUrl: data.loader_url || data.loaderUrl,
        hubId: data.hub_id || data.hubId,
        gameId: data.game_id || data.gameId,
        ownerId: data.owner_id || data.ownerId,
        status: data.status,
        views: data.views || 0,
        likes: data.likes || 0,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        ownerUsername: data.owner_username || data.ownerUsername,
        ownerDisplayName: data.owner_display_name || data.ownerDisplayName,
        gameName: data.game_name || data.gameName,
        gameSlug: data.game_slug || data.gameSlug,
        gameLogoUrl: data.game_logo_url || data.gameLogoUrl,
        tags: data.tags || [],
        isLiked: data.is_liked || data.isLiked || false,
        isPaid: data.is_paid || data.isPaid || false,
        hasKeySystem: data.has_key_system || data.hasKeySystem || false,
    };
}

export default function TrendingPage() {
    const [timeFilter, setTimeFilter] = useState("today");
    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setIsLoading(true);
                const res = await apiClient.get(`/scripts/trending?period=${timeFilter}`);
                const mapped = (res.data.data || []).map(mapScriptResponse);
                setScripts(mapped);
            } catch (err) {
                // error silently handled
                setScripts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrending();
    }, [timeFilter]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="space-y-1.5">
                <h1 className="heading-base text-2xl">Trending</h1>
                <p className="text-sm text-offgray-500">Most popular scripts ranked by community engagement</p>
            </section>

            {/* Time filter */}
            <section>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {TIME_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setTimeFilter(filter.value)}
                            className={[
                                "text-[13px] tracking-tight whitespace-nowrap rounded-md h-8 px-3 transition-colors duration-100 select-none",
                                timeFilter === filter.value
                                    ? "text-offgray-50 bg-white/[0.08]"
                                    : "text-offgray-500 hover:text-offgray-300 hover:bg-white/[0.04]",
                            ].join(" ")}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Script grid */}
            <section className="min-h-[300px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-xl bg-white/[0.02] animate-pulse border border-white/[0.05]" />
                        ))}
                    </div>
                ) : scripts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {scripts.map((script, i) => (
                            <div key={script.id} className="relative">
                                {/* Rank badge */}
                                <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                    <span className={[
                                        "text-[10px] font-medium font-mono",
                                        i < 3 ? "text-emerald-400" : "text-offgray-500",
                                    ].join(" ")}>
                                        {i + 1}
                                    </span>
                                </div>
                                <ScriptCard
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center text-offgray-600 mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>
                        </div>
                        <p className="text-offgray-500 text-sm font-medium">No trending scripts found for this period.</p>
                        <p className="text-offgray-600 text-xs">Try selecting a wider time range.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
