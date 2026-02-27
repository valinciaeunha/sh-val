"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getExecutorBySlug, Executor } from "@/lib/api/executors";
import { getStorageUrl } from "@/lib/utils/image";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    Working: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
    Updating: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
    Patched: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
    Discontinued: { bg: "bg-offgray-500/10", text: "text-offgray-400", dot: "bg-offgray-500" },
    Pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
};

export default function ExecutorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [executor, setExecutor] = useState<Executor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExecutorDetail = async () => {
            if (!slug) return;

            try {
                setIsLoading(true);
                const data = await getExecutorBySlug(slug);
                setExecutor(data);
            } catch (err: any) {
                setError(err.message || "Failed to load executor details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutorDetail();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !executor) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center space-y-6 max-w-lg mx-auto px-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-panel border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" x2="12" y1="9" y2="13" />
                            <line x1="12" x2="12.01" y1="17" y2="17" />
                        </svg>
                    </div>
                    <div className="space-y-3">
                        <h1 className="heading-base text-4xl md:text-5xl tracking-tight">Executor not found</h1>
                        <p className="text-offgray-400 text-sm md:text-base leading-relaxed">
                            The executor you are looking for doesn't exist or has been removed. Check the URL or return to the executors page.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Link
                            href="/executors"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-black transition-colors min-w-[140px]"
                        >
                            Browse Executors
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-surface-panel hover:bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-offgray-200 transition-colors min-w-[140px]"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusStyle = STATUS_CONFIG[executor.status] || STATUS_CONFIG["Working"];

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-offgray-600">
                <Link
                    href="/executors"
                    className="hover:text-offgray-300 transition-colors"
                >
                    Executors
                </Link>
                <span className="text-white/[0.08]">/</span>
                <span className="text-offgray-400 truncate max-w-[200px]">{executor.name}</span>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Media & Details */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Hero Banner Area */}
                    <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0f11] group">
                        {executor.bannerUrl ? (
                            <Image
                                src={getStorageUrl(executor.bannerUrl)}
                                alt={executor.name}
                                fill
                                priority
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col justify-center items-center opacity-10">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Status Overlay */}
                        <div
                            className={`absolute top-4 right-4 px-2.5 py-1 rounded text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 z-10 ${statusStyle.bg} ${statusStyle.text} border border-white/5`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {executor.status}
                        </div>

                        {/* Logo & Title Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4 z-10">
                            {executor.logoUrl && (
                                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-2xl bg-black/50 backdrop-blur-md border border-white/10 shrink-0">
                                    <Image src={getStorageUrl(executor.logoUrl)} alt={`${executor.name} logo`} width={80} height={80} className="object-cover w-full h-full" unoptimized />
                                </div>
                            )}
                            <div className="flex-1 pb-1">
                                <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
                                    {executor.name}
                                </h1>
                                <div className="flex items-center gap-3 mt-1.5 text-sm font-mono">
                                    <span className="text-offgray-300">By {executor.ownerUsername || 'Unknown'}</span>
                                    <span className="text-white/20">•</span>
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${executor.priceModel === "Paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                        executor.priceModel === "Keyless" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        }`}>
                                        {executor.priceModel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Details Row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-offgray-400 bg-surface-panel px-4 py-3 rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                            <span>Platforms: <span className="text-offgray-200">{executor.platforms?.join(", ") || "Unknown"}</span></span>
                        </div>
                        <span className="text-white/10">|</span>
                        <div className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span>Updated <span className="text-offgray-200">{formatDistanceToNow(new Date(executor.updatedAt), { addSuffix: true })}</span></span>
                        </div>
                        {executor.latestVersion && (
                            <>
                                <span className="text-white/10">|</span>
                                <div className="flex items-center gap-1.5">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                                    <span>Version <span className="text-offgray-200">{executor.latestVersion}</span></span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* About Section */}
                    {executor.description && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-serif text-white">About {executor.name}</h3>
                            <div className="text-sm leading-relaxed text-offgray-400 whitespace-pre-wrap">
                                {executor.description}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {executor.tags && executor.tags.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-mono font-bold text-offgray-500 uppercase tracking-wider">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {executor.tags.map((tag) => (
                                    <span key={tag} className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-xs text-offgray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Actions & Links */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Primary Actions */}
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />

                        <h3 className="text-sm font-semibold text-white">Get {executor.name}</h3>

                        {executor.website && (
                            <a
                                href={executor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 h-11 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold tracking-wide transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Official Website
                            </a>
                        )}

                        {!executor.website && (
                            <div className="p-3 text-center bg-black/40 rounded border border-white/5">
                                <span className="text-xs text-offgray-500 font-mono">No official website provided</span>
                            </div>
                        )}

                        {executor.versions && executor.versions.length > 0 && (
                            <div className="pt-3 border-t border-emerald-500/10 flex flex-col gap-2">
                                <p className="text-[10px] text-offgray-500 font-mono uppercase tracking-widest">Releases / Versions</p>
                                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-white/[0.02] hover:scrollbar-thumb-white/20">
                                    {executor.versions.map((ver, idx) => (
                                        <div key={ver.id} className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2 relative overflow-hidden shrink-0">
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 shrink-0 flex items-center justify-center border border-emerald-500/20">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-offgray-100">{ver.version}</p>
                                                            {idx === 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                                                                    Latest
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-mono text-offgray-500" title={new Date(ver.createdAt).toLocaleString()}>
                                                            {formatDistanceToNow(new Date(ver.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={ver.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 text-[10px] font-bold uppercase tracking-wider transition-all mt-1"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                            {ver.patchNotes && (
                                                <div className="mt-2 pt-2 border-t border-white/[0.04] relative z-10">
                                                    <p className="text-[10px] font-mono text-offgray-600 mb-1 uppercase tracking-widest">Changelog</p>
                                                    <div className="text-[11px] leading-relaxed text-offgray-400 whitespace-pre-wrap font-mono">
                                                        {ver.patchNotes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Socials & Community */}
                    {(executor.discord || executor.telegram) && (
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-panel space-y-3">
                            <h3 className="text-xs font-mono font-bold text-offgray-500 uppercase tracking-wider">Community</h3>
                            <div className="space-y-2">
                                {executor.discord && (
                                    <a
                                        href={executor.discord}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 transition-all group"
                                    >
                                        <div className="text-[#5865F2]">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-offgray-200 group-hover:text-white transition-colors">Discord Server</p>
                                        </div>
                                    </a>
                                )}
                                {executor.telegram && (
                                    <a
                                        href={executor.telegram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 hover:bg-[#2AABEE]/10 hover:border-[#2AABEE]/30 transition-all group"
                                    >
                                        <div className="text-[#2AABEE]">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-offgray-200 group-hover:text-white transition-colors">Telegram Group</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
