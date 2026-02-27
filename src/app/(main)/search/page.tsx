"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ScriptCard } from "@/components/home/ScriptCard";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { formatRelativeTime } from "@/lib/utils/date";
import Link from "next/link";

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const tag = searchParams.get("tag") || "";

    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // If both are present, we prioritize the one that fits a general search
                // But our API now handles them as separate filters
                const results = await scriptsApi.getAllScripts({
                    query: query || undefined,
                    tag: tag || query || undefined // fallback query as tag for convenience if needed
                });

                setScripts(results.scripts || results);
            } catch (err: any) {
                // error silently handled
                setError("Failed to fetch search results. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query, tag]);

    const title = tag ? `Tag: ${tag}` : query ? `Search: ${query}` : "All Scripts";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    Discovery
                </div>
                <h1 className="heading-base text-2xl md:text-3xl flex items-center gap-3">
                    {title}
                    <span className="text-sm font-normal text-offgray-600 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        {scripts.length} results
                    </span>
                </h1>
            </section>

            {/* Results Grid */}
            <section className="min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-video rounded-xl bg-white/[0.02] animate-pulse border border-white/[0.05]" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-red-500/20 bg-red-500/[0.02]">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                ) : scripts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {scripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                title={script.title}
                                game={script.gameName || "Unknown Game"}
                                stars={script.views}
                                statType="views"
                                timeAgo={formatRelativeTime(script.createdAt)}
                                color="#14291e"
                                href={`/s/${script.slug}`}
                                gameSlug={script.gameSlug}
                                thumbnailUrl={script.thumbnailUrl}
                                fallbackType="icon"
                                isPaid={script.isPaid}
                                hasKeySystem={script.hasKeySystem}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] text-offgray-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <div className="space-y-1">
                            <p className="text-offgray-300 font-medium">No scripts found</p>
                            <p className="text-offgray-500 text-xs">Try searching for something else or browse popular scripts.</p>
                        </div>
                        <Link
                            href="/trending"
                            className="inline-flex h-9 px-4 items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            Browse Trending
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
