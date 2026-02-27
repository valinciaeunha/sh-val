"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import FallbackImage from "@/components/ui/FallbackImage";
import { gamesApi, Game } from "@/lib/api/games";
import { ScriptCard } from "@/components/home/ScriptCard";
import { formatRelativeTime } from "@/lib/utils/date";
import { getStorageUrl } from "@/lib/utils/image";

export default function GameDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGameDetail = async () => {
            if (!slug) return;
            try {
                setIsLoading(true);
                const data = await gamesApi.getGameBySlug(slug);
                setGame(data);
            } catch (err: any) {
                // error silently handled
                setError(err.message || "Failed to load game details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchGameDetail();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center space-y-6 max-w-lg mx-auto px-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-surface-panel border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" x2="12" y1="9" y2="13" />
                            <line x1="12" x2="12.01" y1="17" y2="17" />
                        </svg>
                    </div>

                    {/* Text */}
                    <div className="space-y-3">
                        <h1 className="heading-base text-4xl md:text-5xl tracking-tight">Page not found</h1>
                        <p className="text-offgray-400 text-sm md:text-base leading-relaxed">
                            The page you are looking for doesn&apos;t exist or has been moved. Check the URL or return to the home page.
                        </p>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Link
                            href="/games"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-black transition-colors duration-200 min-w-[140px]"
                        >
                            Browse Games
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-surface-panel hover:bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-offgray-200 transition-colors duration-200 min-w-[140px]"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Back Link */}
            <Link
                href="/games"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-offgray-500 hover:text-emerald-400 transition-colors group"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                Back to Games
            </Link>

            {/* Header / Banner Section */}
            <section className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                {/* Banner */}
                <div className="relative h-40 md:h-56 bg-gradient-to-br from-gray-800 to-gray-900">
                    {game.bannerUrl && (
                        <FallbackImage
                            src={getStorageUrl(game.bannerUrl)}
                            alt={`${game.name} banner`}
                            fill
                            priority
                            loading="eager"
                            iconType="game"
                            className="object-cover opacity-80"
                            sizes="100vw"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] via-[#0a0c0f]/40 to-transparent" />
                </div>

                {/* Info Area */}
                <div className="relative px-6 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        {/* Logo */}
                        <div className="-mt-12 md:-mt-16 w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-[#0a0c0f] bg-surface-panel shadow-2xl overflow-hidden relative shrink-0 z-10">
                            {game.logoUrl ? (
                                <FallbackImage
                                    src={getStorageUrl(game.logoUrl)}
                                    alt={`${game.name} logo`}
                                    fill
                                    iconType="game"
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100px, 128px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-ground text-offgray-500 font-bold text-3xl">
                                    {game.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 space-y-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-offgray-50">
                                {game.name}
                            </h1>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-offgray-500 uppercase tracking-[0.1em]">
                                <span className="flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    {game.platform}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-offgray-700/50" />
                                <span className="flex items-center gap-1.5 transition-colors hover:text-offgray-300 cursor-default">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    {game.scripts?.length || 0} {game.scripts?.length === 1 ? 'Script' : 'Scripts'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scripts Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <h2 className="text-lg font-semibold text-offgray-50">Discovery</h2>
                    <span className="text-xs text-offgray-500">{game.scripts?.length || 0} items available</span>
                </div>

                {game.scripts && game.scripts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {game.scripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                title={script.title}
                                game={game.name}
                                stars={script.views}
                                statType="views"
                                timeAgo={formatRelativeTime(script.createdAt)}
                                color="#14291e"
                                href={`/s/${script.slug}`}
                                thumbnailUrl={script.thumbnailUrl}
                                fallbackType="icon"
                                isPaid={script.isPaid}
                                hasKeySystem={script.hasKeySystem}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center text-offgray-600 mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                        <p className="text-offgray-500 text-sm font-medium">No scripts have been published for this game yet.</p>
                        <p className="text-offgray-600 text-xs">Check back later or explore other games in the directory.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
