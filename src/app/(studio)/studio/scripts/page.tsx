"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authApi } from "@/lib/api/auth";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { getStorageUrl } from "@/lib/utils/image";

const STATUS_STYLES: Record<Script["status"], { label: string; cls: string; indicator: string }> = {
    published: { label: "Published", cls: "bg-[#059669]/20 text-[#10B981] border-[#10B981]/30", indicator: "bg-[#10B981]" },
    draft: { label: "Draft", cls: "bg-white/[0.04] text-offgray-400 border-white/[0.08]", indicator: "bg-offgray-600" },
    under_review: { label: "Reviewing", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", indicator: "bg-amber-500" },
};

export default function StudioScriptsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [filter, setFilter] = useState<"all" | Script["status"]>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteConfirmScript, setDeleteConfirmScript] = useState<Script | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        if (!authApi.isAuthenticated()) {
            router.push("/home");
            return;
        }

        const fetchScripts = async () => {
            try {
                const data = await scriptsApi.getMyScripts();
                setScripts(data);
            } catch (error) {
                // error silently handled
            } finally {
                setIsLoading(false);
            }
        };

        fetchScripts();
    }, [router]);

    const filteredScripts = scripts.filter((s) => {
        const matchesFilter = filter === "all" || s.status === filter;
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleShare = (script: Script) => {
        const url = `${window.location.origin}/s/${script.slug || script.id}`;
        navigator.clipboard.writeText(url);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmScript) return;
        try {
            await scriptsApi.deleteScript(deleteConfirmScript.id);
            setScripts(prev => prev.filter(s => s.id !== deleteConfirmScript.id));
        } catch (error) {
            // error silently handled
        }
        setDeleteConfirmScript(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-offgray-500 uppercase tracking-widest">Loading Repository...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                        Script Repository
                    </h1>
                    <p className="text-sm font-mono text-offgray-500 max-w-lg">
                        Manage, update, and deploy your code payloads.
                    </p>
                </div>

                <Link
                    href="/studio/scripts/new"
                    className="group relative inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="relative z-10">New Payload</span>
                </Link>
            </section>

            {/* Filter Tabs */}
            <section className="flex flex-wrap items-center gap-x-8 border-b border-white/[0.04]">
                {(["all", "published", "draft", "under_review"] as const).map((key) => {
                    const labels: Record<string, string> = { all: "All Payloads", published: "Published", draft: "Drafts", under_review: "Reviewing" };
                    const isActive = filter === key;
                    const count = key === "all" ? scripts.length : scripts.filter(s => s.status === key).length;

                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`relative h-12 flex items-center gap-2.5 text-[11px] font-mono tracking-widest uppercase transition-all duration-300 
                            ${isActive ? "text-[#10B981] font-semibold" : "text-offgray-500 hover:text-offgray-300"}
                        `}
                        >
                            {labels[key]}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/[0.03] text-offgray-600 border border-white/[0.05]"}`}>
                                {count}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    );
                })}
            </section>

            {/* Repository Table Container */}
            <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group/table shadow-xl shadow-black/20">
                {/* Table Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* Table Header / Toolbar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-2.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                        <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">Payload List</h2>
                        <span className="text-[10px] font-mono text-offgray-600 bg-white/[0.04] rounded-full px-2 py-0.5">
                            {filteredScripts.length} items
                        </span>
                    </div>
                    <div className="relative">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search repository..."
                            className="h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs font-mono text-offgray-300 placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 transition-all w-44 sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filteredScripts.length > 0 ? (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    <th className="py-2.5 px-5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Payload</th>
                                    <th className="py-2.5 px-5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Views / Likes</th>
                                    <th className="py-2.5 px-5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Updated At</th>
                                    <th className="py-2.5 px-5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest text-right whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {filteredScripts.map((script) => (
                                    <tr
                                        key={script.id}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group/row cursor-pointer"
                                        onClick={() => router.push(`/studio/scripts/${script.id}/edit`)}
                                    >
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/50 border border-white/[0.06] flex items-center justify-center">
                                                    {script.thumbnailUrl ? (
                                                        <Image
                                                            src={getStorageUrl(script.thumbnailUrl)}
                                                            alt={script.title}
                                                            fill
                                                            className="object-cover opacity-80 group-hover/row:opacity-100 transition-opacity"
                                                            sizes="40px"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-offgray-700 bg-[url('/grid.svg')] bg-center" style={{ backgroundSize: '8px 8px' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-medium text-offgray-100 group-hover/row:text-emerald-300 transition-colors truncate max-w-[200px]">
                                                        {script.title}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-offgray-500 truncate max-w-[150px]">
                                                        {script.slug || script.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider uppercase ${STATUS_STYLES[script.status].cls}`}>
                                                <span className={`w-1 h-1 rounded-full ${STATUS_STYLES[script.status].indicator}`} />
                                                {STATUS_STYLES[script.status].label}
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 hidden lg:table-cell">
                                            <div className="flex items-center gap-3 text-[11px] font-mono text-offgray-400">
                                                <span className="flex items-center gap-1">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    {script.views || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                                    {script.likes || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 hidden sm:table-cell">
                                            <p className="text-[11px] font-mono text-offgray-500">
                                                {new Date(script.updatedAt || script.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="py-3 px-5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleCopyId(script.id)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-offgray-500 hover:text-white border border-white/[0.06] transition-all opacity-0 group-hover/row:opacity-100"
                                                    title="Copy ID"
                                                >
                                                    {copiedId === script.id ? (
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                                    ) : (
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleShare(script)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-offgray-500 hover:text-white border border-white/[0.06] transition-all opacity-0 group-hover/row:opacity-100"
                                                    title="Copy Link"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                                </button>
                                                <Link
                                                    href={`/studio/scripts/${script.id}/edit`}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-offgray-500 hover:text-white border border-white/[0.06] transition-all opacity-0 group-hover/row:opacity-100"
                                                    title="Edit"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteConfirmScript(script)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-rose-500/10 text-offgray-500 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/20 transition-all opacity-0 group-hover/row:opacity-100"
                                                    title="Delete"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-offgray-600">
                                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-serif text-white mb-2">No Payloads Found</h3>
                            <p className="text-sm font-mono text-offgray-500 max-w-xs mx-auto mb-8">
                                There are no scripts matching your criteria. Start by creating a new payload.
                            </p>
                            <Link
                                href="/studio/scripts/new"
                                className="inline-flex items-center justify-center gap-2 h-9 px-6 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10"
                            >
                                Create New Payload
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Delete Confirmation Modal */}
            {deleteConfirmScript && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirmScript(null)} />
                    <div className="relative w-full max-w-sm bg-[#0a0c10] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-serif text-white">Delete Payload?</h3>
                                <p className="text-sm font-mono text-offgray-500">
                                    Are you sure you want to delete <span className="text-white">&quot;{deleteConfirmScript.title}&quot;</span>? This action is permanent.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.04] flex gap-3">
                            <button onClick={() => setDeleteConfirmScript(null)} className="flex-1 h-10 rounded-lg border border-white/[0.08] text-xs font-mono text-offgray-300 hover:text-white hover:bg-white/[0.02] transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="flex-1 h-10 rounded-lg bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold transition-all shadow-lg shadow-rose-500/20">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
