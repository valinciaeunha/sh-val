"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { hubsApi, Hub } from "@/lib/api/hubs";
import { getStorageUrl } from "@/lib/utils/image";
import { HubScriptModal } from "@/components/ui/HubScriptModal";

export default function StudioHubsPage() {
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHubForScripts, setSelectedHubForScripts] = useState<Hub | null>(null);

    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const data = await hubsApi.getMyHubs();
                setHubs(data);
            } catch (error) {
                // error silently handled
            } finally {
                setIsLoading(false);
            }
        };

        fetchHubs();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-offgray-500 uppercase tracking-widest">Loading Collectives...</p>
                </div>
            </div>
        );
    }

    if (hubs.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Collectives</h1>
                        <p className="text-sm font-mono text-offgray-500">Manage your brand hubs and grouped scripts</p>
                    </div>
                </section>

                <div className="flex flex-col items-center justify-center py-20 px-4 h-[40vh] border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" style={{ backgroundSize: '20px 20px' }} />
                    <div className="w-16 h-16 rounded-2xl bg-[#11141A] border border-white/[0.06] shadow-2xl flex items-center justify-center mb-6 relative z-10 group-hover:border-[#10B981]/30 transition-colors duration-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600 group-hover:text-[#10B981] transition-colors duration-500">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2 max-w-sm mb-8 relative z-10">
                        <h2 className="text-lg font-serif tracking-tight text-offgray-100">No Hubs Yet</h2>
                        <p className="text-sm font-mono text-offgray-500">Create a central hub to organize your scripts under one unified brand.</p>
                    </div>
                    <Link
                        href="/studio/hubs/register"
                        className="relative z-10 inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-[#059669] hover:bg-[#10B981] text-sm font-medium text-white transition-all overflow-hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Initialize Hub
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Collectives</h1>
                    <p className="text-sm font-mono text-offgray-500">Manage your brand hubs and grouped scripts</p>
                </div>
            </section>

            {/* Pending Hub Alert */}
            {hubs.some(h => h.status === 'pending') && (
                <div className="flex items-center gap-3 p-4 bg-[#11141A] border border-amber-500/20 rounded-xl">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-400">Hub Initializing - Pending Approval</p>
                        <p className="text-xs font-mono text-amber-500/60 mt-0.5 tracking-wide">Systems are processing your brand application. Expected ETA: 24-48 hours.</p>
                    </div>
                </div>
            )}

            {/* Hub List */}
            <div className="space-y-3">
                {hubs.map((hub) => (
                    <div
                        key={hub.id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-300 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />

                        {/* Logo */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/50 border border-white/[0.06] shrink-0 group-hover:border-white/[0.1] transition-colors mt-1 sm:mt-0">
                            {hub.logoUrl ? (
                                <Image
                                    src={getStorageUrl(hub.logoUrl)}
                                    alt={`${hub.name} logo`}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-serif font-bold text-offgray-600 bg-[url('/grid.svg')] bg-center tracking-tighter" style={{ backgroundSize: '10px 10px' }}>
                                    {hub.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1 mb-4 sm:mb-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-medium text-offgray-100 truncate group-hover:text-white transition-colors relative z-10">
                                    <Link href={`/h/${hub.slug}`} className="hover:underline underline-offset-4 decoration-white/20">
                                        {hub.name}
                                    </Link>
                                </h3>
                                {hub.isVerified && (
                                    <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                )}
                                {hub.isOfficial && (
                                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                                )}
                            </div>
                            <p className="text-[12px] text-offgray-500 truncate max-w-xl">
                                {hub.description || "No description provided."}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                            <span className={`inline-flex items-center h-5 px-1.5 rounded-[4px] text-[9px] font-mono tracking-widest uppercase border shrink-0 ${hub.status === 'active'
                                ? 'bg-[#059669]/20 text-[#10B981] border-[#10B981]/30'
                                : hub.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-white/[0.04] text-offgray-400 border-white/[0.08]'
                                }`}>
                                {hub.status}
                            </span>

                            {/* Script Count */}
                            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-offgray-500 shrink-0 min-w-[80px] justify-end">
                                <span className="text-[#10B981]">{hub.scriptCount}</span>
                                <span className="text-offgray-600">payloads</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 pl-4 border-l border-white/[0.04] relative z-20">
                                <Link
                                    href={`/h/${hub.slug}`}
                                    className="p-2 rounded-md text-offgray-600 hover:text-white hover:bg-white/[0.05] transition-colors"
                                    title="Visit Hub"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </Link>
                                <button
                                    onClick={(e) => { e.preventDefault(); hub.status !== 'pending' && setSelectedHubForScripts(hub); }}
                                    disabled={hub.status === 'pending'}
                                    className={`p-2 rounded-md transition-colors ${hub.status === 'pending'
                                        ? 'text-offgray-700 cursor-not-allowed'
                                        : 'text-offgray-600 hover:text-white hover:bg-white/[0.05]'
                                        }`}
                                    title={hub.status === 'pending' ? 'Hub is pending review' : 'Manage Scripts'}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                {hub.status === 'pending' ? (
                                    <span
                                        className="p-2 text-offgray-700 cursor-not-allowed"
                                        title="Hub is pending review"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    </span>
                                ) : (
                                    <Link
                                        href={`/studio/hubs/${hub.slug}/edit`}
                                        className="p-2 rounded-md text-offgray-600 hover:text-white hover:bg-white/[0.05] transition-colors"
                                        title="Edit Hub"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Script Management Modal */}
            {selectedHubForScripts && (
                <HubScriptModal
                    hub={selectedHubForScripts}
                    onClose={() => setSelectedHubForScripts(null)}
                />
            )}
        </div>
    );
}
