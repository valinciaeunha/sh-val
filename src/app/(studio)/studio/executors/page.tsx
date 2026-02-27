"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMyExecutors, Executor } from "@/lib/api/executors";
import { authApi } from "@/lib/api/auth";
import { getStorageUrl } from "@/lib/utils/image";

export default function StudioExecutorsPage() {
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setUser(authApi.getStoredUser());

        const fetchExecutors = async () => {
            try {
                const data = await getMyExecutors();
                setExecutors(data);
            } catch (error) {
                // error silently handled
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutors();
    }, []);

    const isDiscordUser = user?.avatarUrl?.includes('discord') || false;

    if (user && !isDiscordUser) {
        return (
            <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-[#11141A] border border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-serif tracking-tight text-white">
                        Access Restricted
                    </h2>
                    <p className="text-sm font-mono text-offgray-400 leading-relaxed max-w-[90%] mx-auto">
                        To maintain a high-quality ecosystem and thoroughly review new Executors, maintaining a verified <span className="text-[#5865F2] font-semibold border-b border-[#5865F2]/40 pb-0.5">Discord connection</span> is mandatory. <br />
                        <br />
                        Please log out and sign in using Discord OAuth to manage your Executor.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-offgray-500 uppercase tracking-widest">Loading Brands...</p>
                </div>
            </div>
        );
    }

    if (executors.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Executors</h1>
                        <p className="text-sm font-mono text-offgray-500">Manage your executor brands and releases</p>
                    </div>
                </section>

                <div className="flex flex-col items-center justify-center py-20 px-4 h-[40vh] border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" style={{ backgroundSize: '20px 20px' }} />
                    <div className="w-16 h-16 rounded-2xl bg-[#11141A] border border-white/[0.06] shadow-2xl flex items-center justify-center mb-6 relative z-10 group-hover:border-[#10B981]/30 transition-colors duration-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600 group-hover:text-[#10B981] transition-colors duration-500">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2 max-w-sm mb-8 relative z-10">
                        <h2 className="text-lg font-serif tracking-tight text-offgray-100">No Executors Yet</h2>
                        <p className="text-sm font-mono text-offgray-500">Create a centralized brand for your Roblox executor to get listed on the main page.</p>
                    </div>
                    <Link
                        href="/studio/executors/register"
                        className="relative z-10 inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-[#059669] hover:bg-[#10B981] text-sm font-medium text-white transition-all overflow-hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Register Executor
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
                    <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Executors</h1>
                    <p className="text-sm font-mono text-offgray-500">Manage your executor brands and releases</p>
                </div>
                {executors.length === 0 && (
                    <Link
                        href="/studio/executors/register"
                        className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#059669] hover:bg-[#10B981] text-xs font-medium text-white transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/40"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Executor
                    </Link>
                )}
            </section>

            {/* Pending Executor Alert */}
            {executors.some(e => e.status === 'Pending') && (
                <div className="flex items-center gap-3 p-4 bg-[#11141A] border border-amber-500/20 rounded-xl">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-400">Application Pending Approval</p>
                        <p className="text-xs font-mono text-amber-500/60 mt-0.5 tracking-wide">Our moderators are reviewing your executor listing. Expected ETA: 24 hours.</p>
                    </div>
                </div>
            )}

            {/* Executors List */}
            <div className="space-y-3">
                {executors.map((executor) => (
                    <div
                        key={executor.id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-300 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />

                        {/* Logo */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/50 border border-white/[0.06] shrink-0 group-hover:border-white/[0.1] transition-colors mt-1 sm:mt-0 flex items-center justify-center">
                            {executor.logoUrl ? (
                                <Image
                                    src={getStorageUrl(executor.logoUrl)}
                                    alt={`${executor.name} logo`}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />
                            ) : (
                                <div className="text-lg font-serif font-bold text-offgray-600 tracking-tighter">
                                    {executor.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1 mb-4 sm:mb-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-medium text-offgray-100 truncate group-hover:text-white transition-colors relative z-10">
                                    {executor.status === 'Pending' ? (
                                        <span className="cursor-not-allowed">{executor.name}</span>
                                    ) : (
                                        <Link href={`/studio/executors/${executor.slug}`} className="hover:underline underline-offset-4 decoration-white/20">
                                            {executor.name}
                                        </Link>
                                    )}
                                </h3>
                                <span className={`inline-flex items-center h-4 px-1 rounded-sm text-[8px] font-mono tracking-widest uppercase border shrink-0 bg-white/[0.02] border-white/[0.05] text-offgray-400`}>
                                    {executor.priceModel}
                                </span>
                            </div>
                            <p className="text-[12px] text-offgray-500 truncate max-w-xl">
                                {executor.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-[#10B981]">
                                    {executor.latestVersion ? executor.latestVersion : 'v1.0.0'}
                                </span>
                                {(executor.platforms || []).map(p => (
                                    <span key={p} className="text-[10px] font-mono tracking-widest uppercase text-offgray-600">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                            <span className={`inline-flex items-center h-5 px-1.5 rounded-[4px] text-[9px] font-mono tracking-widest uppercase border shrink-0 ${executor.status === 'Working'
                                ? 'bg-[#059669]/20 text-[#10B981] border-[#10B981]/30'
                                : executor.status === 'Pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : executor.status === 'Patched'
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                }`}>
                                {executor.status}
                            </span>

                            {/* Actions */}
                            <div className={`flex items-center justify-end gap-1 ${executor.status === 'Pending' ? 'opacity-30 pointer-events-none' : ''}`}>
                                <Link
                                    href={executor.status === 'Pending' ? '#' : `/studio/executors/${executor.slug}/releases`}
                                    className={`p-2 rounded-md transition-colors tooltip-trigger relative group ${executor.status === 'Pending' ? 'text-offgray-600 cursor-not-allowed' : 'text-offgray-500 hover:text-white hover:bg-white/5'}`}
                                    onClick={executor.status === 'Pending' ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] uppercase font-mono tracking-widest rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        Releases
                                    </span>
                                </Link>
                                <Link
                                    href={executor.status === 'Pending' ? '#' : `/studio/executors/${executor.slug}`}
                                    className={`p-2 rounded-md transition-colors tooltip-trigger relative group ${executor.status === 'Pending' ? 'text-offgray-600 cursor-not-allowed' : 'text-offgray-500 hover:text-white hover:bg-white/5'}`}
                                    onClick={executor.status === 'Pending' ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] uppercase font-mono tracking-widest rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        Edit
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
