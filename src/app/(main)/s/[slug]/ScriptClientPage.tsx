"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { getStorageUrl } from "@/lib/utils/image";
import { CommentSection } from "@/components/scripts/CommentSection";
import { useUser } from "@/hooks/useUser";
import { formatRelativeTime } from "@/lib/utils/date";
import { useAuth } from "@/contexts/AuthContext";

export default function ScriptDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const [script, setScript] = useState<Script | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const { user } = useUser();
    const viewRecordedRef = useRef(false);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const [backLabel, setBackLabel] = useState("Scripts");
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMoreButton, setShowMoreButton] = useState(false);
    const { openAuthModal } = useAuth();

    useEffect(() => {
        const fetchScriptDetail = async () => {
            if (!slug) return;

            try {
                setIsLoading(true);
                const data = await scriptsApi.getScriptBySlug(slug);
                setScript(data);
            } catch (err: any) {
                // // error silently handled
                setError(err.message || "Failed to load script details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchScriptDetail();
    }, [slug]);

    // Record view
    useEffect(() => {
        if (script && !viewRecordedRef.current) {
            scriptsApi.recordView(script.id);
            viewRecordedRef.current = true;
        }
    }, [script]);

    // Handle breadcrumb label based on referrer
    useEffect(() => {
        if (typeof window !== "undefined" && document.referrer) {
            const referrer = document.referrer;
            const currentOrigin = window.location.origin;

            if (referrer.includes(currentOrigin)) {
                const path = referrer.replace(currentOrigin, "");

                if (path === "/" || path === "") {
                    setBackLabel("Home");
                } else if (path.includes("/trending")) {
                    setBackLabel("Trending");
                } else if (path.includes("/search")) {
                    setBackLabel("Search");
                } else if (path.includes("/h/")) {
                    setBackLabel(script?.hubName || "Hub");
                } else if (path.includes("/p/")) {
                    setBackLabel("Profile");
                }
            }
        }
    }, [script]);

    // Check if description needs "Show More"
    useEffect(() => {
        if (script?.description && descriptionRef.current) {
            const element = descriptionRef.current;
            // Check if height exceeds approx 7 lines (13px * 1.625 leading-relaxed * 7 = ~148px)
            // Using a bit higher threshold for safety
            if (element.scrollHeight > 160) {
                setShowMoreButton(true);
            }
        }
    }, [script?.description]);

    const handleLike = async () => {
        if (!script) return;

        if (!user) {
            openAuthModal('login');
            return;
        }

        // Optimistic update
        const previousIsLiked = script.isLiked;
        const previousLikes = script.likes;

        setScript(prev => prev ? ({
            ...prev,
            isLiked: !prev.isLiked,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
        }) : null);

        try {
            await scriptsApi.toggleLike(script.id);
        } catch (err) {
            // error silently handled
            // Revert on error
            setScript(prev => prev ? ({
                ...prev,
                isLiked: previousIsLiked,
                likes: previousLikes
            }) : null);
        }
    };

    const handleCopyLoader = () => {
        if (script?.loaderUrl) {
            navigator.clipboard.writeText(script.loaderUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            // Record copy event (fire-and-forget)
            scriptsApi.recordCopy(script.id);
        }
    };

    const handleCommentCountChange = useCallback((count: number) => {
        setScript(prev => {
            if (!prev || prev.comments_count === count) return prev;
            return { ...prev, comments_count: count };
        });
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !script) {
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
                            href="/trending"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-black transition-colors duration-200 min-w-[140px]"
                        >
                            Return Home
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
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-offgray-600">
                <button
                    onClick={() => router.back()}
                    className="hover:text-offgray-300 transition-colors"
                >
                    {backLabel}
                </button>
                <span className="text-white/[0.08]">/</span>
                <span className="text-offgray-400 truncate max-w-[200px]">{script.title}</span>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                {/* Left Column: Media & Details */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0f11] group">
                        {script.thumbnailUrl ? (
                            <Image
                                src={getStorageUrl(script.thumbnailUrl)}
                                alt={script.title}
                                fill
                                priority
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-panel text-offgray-800">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Title + Author + Meta */}
                    <div className="space-y-2">
                        {/* Title */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-lg font-bold text-offgray-50 tracking-tight leading-snug">
                                {script.title}
                            </h1>
                            {(script.isPaid || script.hasKeySystem) && (
                                <div className="flex items-center gap-1.5">
                                    {script.isPaid && (
                                        <div className="bg-amber-500/90 backdrop-blur-sm text-[10px] font-bold text-black px-2 py-0.5 rounded flex items-center gap-1">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="1" x2="12" y2="23" />
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                            Paid
                                        </div>
                                    )}
                                    {script.hasKeySystem && (
                                        <div className="bg-cyan-500/90 backdrop-blur-sm text-[10px] font-bold text-black px-2 py-0.5 rounded flex items-center gap-1">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                            </svg>
                                            Key
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Row 1: Author */}
                        <div className="flex items-center gap-1.5 text-[12px]">
                            {script.hubName ? (
                                <>
                                    <span className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-800 to-black border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0">
                                        {script.hubLogoUrl ? (
                                            <Image src={getStorageUrl(script.hubLogoUrl)} alt={script.hubName} width={20} height={20} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-[9px] font-bold text-offgray-400">{script.hubName.charAt(0)}</span>
                                        )}
                                    </span>
                                    <Link href={`/h/${script.hubSlug || script.hubId}`} className="font-semibold text-offgray-100 hover:text-white transition-colors">
                                        {script.hubName}
                                    </Link>
                                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                    <span className="text-offgray-700">·</span>
                                    <Link href={`/p/${script.ownerUsername}`} className="text-offgray-500 hover:text-offgray-300 transition-colors">
                                        @{script.ownerUsername}
                                    </Link>
                                </>
                            ) : (
                                <Link href={`/p/${script.ownerUsername}`} className="flex items-center gap-1.5 group/author">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-panel border border-white/[0.08] shrink-0">
                                        {script.ownerAvatarUrl ? (
                                            <Image src={getStorageUrl(script.ownerAvatarUrl)} alt={script.ownerUsername || ''} width={20} height={20} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-[9px] font-bold text-offgray-400">
                                                {(script.ownerUsername || "?").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-medium text-offgray-100 group-hover/author:text-white transition-colors">
                                        {script.ownerDisplayName || script.ownerUsername}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </Link>
                            )}
                        </div>

                        {/* Row 2: Game + Stats + Date */}
                        <div className="flex items-center gap-2.5 text-[11px] text-offgray-500">
                            {script.gameName && (
                                <>
                                    <div className="flex items-center gap-1">
                                        {script.gameLogoUrl && (
                                            <div className="relative w-3.5 h-3.5 rounded overflow-hidden bg-surface-ground shrink-0">
                                                <Image src={script.gameLogoUrl} alt={script.gameName} fill className="object-cover" sizes="14px" />
                                            </div>
                                        )}
                                        {script.gameSlug ? (
                                            <Link href={`/g/${script.gameSlug}`} className="hover:text-emerald-400 transition-colors">
                                                {script.gameName}
                                            </Link>
                                        ) : (
                                            <span>{script.gameName}</span>
                                        )}
                                    </div>
                                    <span className="text-offgray-700/50">·</span>
                                </>
                            )}
                            <span className="flex items-center gap-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>

                                {script.views.toLocaleString()}
                            </span>
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-1 transition-colors ${script.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill={script.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.28 3.6-2.33 3.6-5.45C22.6 4.98 19.5 2 15.5 2 13 2 12.33 3.5 12 4.5 11.67 3.5 11 2 8.5 2 4.5 2 1.4 4.98 1.4 8.55c0 3.12 2.11 4.17 3.6 5.45L12 21l7-7z" /></svg>
                                {script.likes.toLocaleString()}
                            </button>
                        </div>

                        {/* Row 3: Dates */}
                        <div className="flex items-center gap-2 text-[10px] text-offgray-600 mt-1.5">
                            <span title={`Posted: ${new Date(script.createdAt).toLocaleString()}`}>
                                Posted {formatRelativeTime(script.createdAt)}
                            </span>
                            {script.updatedAt && script.updatedAt !== script.createdAt && (
                                <>
                                    <span className="text-offgray-700/40">•</span>
                                    <span title={`Updated: ${new Date(script.updatedAt).toLocaleString()}`}>
                                        Updated {formatRelativeTime(script.updatedAt)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {script.description && (
                        <div className="pt-1 space-y-2">
                            <h3 className="text-xs font-bold text-offgray-300">About</h3>
                            <div
                                ref={descriptionRef}
                                className={`text-[13px] leading-relaxed text-offgray-400 whitespace-pre-wrap transition-all duration-300 ${!isExpanded && showMoreButton ? "line-clamp-6 overflow-hidden" : ""}`}
                            >
                                {script.description}
                            </div>
                            {showMoreButton && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-[12px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors mt-1"
                                >
                                    {isExpanded ? "Show less" : "Show all"}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Actions */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Actions: Purchase / Get Key (Compact) */}
                    {(script.isPaid || script.hasKeySystem) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {script.isPaid && script.purchaseUrl && (
                                <a
                                    href={script.purchaseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 h-7 px-3 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Buy Script
                                </a>
                            )}
                            {script.hasKeySystem && script.keySystemUrl && (
                                <a
                                    href={script.keySystemUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 h-7 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                    </svg>
                                    Get Key
                                </a>
                            )}
                        </div>
                    )}

                    {/* Get Script Card */}
                    {script.loaderUrl ? (
                        <div className="rounded-xl border border-white/[0.08] bg-[#0d0f11] overflow-hidden group/code relative">
                            {/* Glow effect */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[60px] pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                    </div>
                                    <span className="text-[10px] font-medium text-offgray-500 ml-2 font-mono">loader.lua</span>
                                </div>
                                <button
                                    onClick={handleCopyLoader}
                                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    {isCopied ? (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            COPIED
                                        </>
                                    ) : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                            COPY
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code Area */}
                            <div
                                onClick={handleCopyLoader}
                                className="p-4 cursor-pointer hover:bg-white/[0.01] transition-colors relative"
                            >
                                <code className="text-[11px] sm:text-xs font-mono text-offgray-300 leading-relaxed break-all whitespace-pre-wrap">
                                    {script.loaderUrl}
                                </code>

                                {/* Click to copy overlay hint */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/code:opacity-100 pointer-events-none transition-opacity duration-200">
                                    <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-medium text-white shadow-xl translate-y-2 group-hover/code:translate-y-0 transition-transform">
                                        Click to copy
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/[0.08] bg-[#0d0f11] overflow-hidden relative">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                </div>
                                <span className="text-[10px] font-medium text-offgray-500 ml-2 font-mono">private script</span>
                            </div>
                            <div className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <p className="text-[11px] font-mono text-offgray-500 leading-relaxed max-w-[240px]">
                                    {script.isPaid
                                        ? "This script is available after purchase."
                                        : script.hasKeySystem
                                            ? "This script requires a key to use."
                                            : "This script is not publicly available."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {script.tags && script.tags.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-offgray-500 uppercase tracking-wider">Tags</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {script.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/search?tag=${tag.name}`}
                                        className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[10px] font-medium text-offgray-400 hover:text-emerald-400 transition-colors"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>


                <div className="lg:col-span-8 border-t border-white/[0.06] pt-8">
                    <CommentSection
                        scriptId={script.id}
                        onCountChange={handleCommentCountChange}
                    />
                </div>
            </div >
        </div >
    );
}
