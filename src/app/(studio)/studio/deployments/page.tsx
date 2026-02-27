"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deploymentsApi, type Deployment, type DeploymentStats } from "@/lib/api/deployments";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";

export default function StudioDeploymentsPage() {
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Data state
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [stats, setStats] = useState<DeploymentStats | null>(null);
    const [planData, setPlanData] = useState<PlanWithMaximums | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // Fetch deployments
    const fetchDeployments = useCallback(async (p = 1, search = "") => {
        try {
            const data = await deploymentsApi.getMyDeployments({ page: p, limit: 20, search });
            setDeployments(data.deployments);
            setTotalPages(data.totalPages);
            setTotalCount(data.total);
            setPage(p);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const data = await deploymentsApi.getStats();
            setStats(data);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // Fetch plan data
    const fetchPlan = useCallback(async () => {
        try {
            const data = await plansApi.getMyPlan();
            setPlanData(data);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchDeployments(1), fetchStats(), fetchPlan()]);
            setLoading(false);
        };
        loadAll();
    }, [fetchDeployments, fetchStats, fetchPlan]);

    // Search handler
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDeployments(1, searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchDeployments]);

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this deployment?")) return;
        try {
            await deploymentsApi.delete(id);
            await Promise.all([fetchDeployments(page, searchQuery), fetchStats()]);
        } catch (err) {
            // error silently handled
        }
    };

    const maxDeployments = planData?.maximums?.maximum_deployments ?? 3;
    const activeCount = stats?.active_deployments ?? 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                        Deployments
                    </h1>
                    <p className="text-sm font-mono text-offgray-500 max-w-lg">
                        Host your files via our high-speed global CDN. Perfect for zero-downtime loadstrings.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="group relative inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span className="relative z-10">New Deployment</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                <Link
                                    href="/studio/deployments/upload"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-offgray-300 hover:text-white hover:bg-white/[0.03] transition-colors"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Upload File
                                </Link>
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-offgray-300 hover:text-white hover:bg-white/[0.03] transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                    Create File
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Analytics Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative p-4 sm:p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-300 group overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    <div className="space-y-2 relative z-10">
                        <p className="flex items-center gap-2 text-[10px] font-mono font-semibold text-emerald-500/80 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 shrink-0 rounded-sm bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" />
                            Maximum Deployments
                        </p>
                        <div className="flex items-center gap-3">
                            <p className="text-2xl md:text-3xl font-serif tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-emerald-200 transition-all">
                                {maxDeployments}
                            </p>
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 leading-none">
                                {Math.max(0, maxDeployments - activeCount)} available
                            </span>
                        </div>
                    </div>
                </div>
                <StatCard label="Active Files" value={loading ? "—" : String(activeCount)} />
                <StatCard label="Total Size" value={loading ? "—" : formatBytes(stats?.total_size ?? 0)} />
                <StatCard label="CDN Requests" value={loading ? "—" : String(stats?.cdn_requests ?? 0)} />
            </section>

            {/* File Repository Table */}
            <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl group/table shadow-xl shadow-black/20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                        </svg>
                        <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">Hosted Files</h2>
                        <span className="text-[10px] font-mono text-offgray-600 bg-white/[0.04] rounded-full px-2 py-0.5">
                            {totalCount} deployments
                        </span>
                    </div>
                    <div className="relative">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search deployments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs font-mono text-offgray-300 placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 transition-all w-44"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04]">
                                <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Title</th>
                                <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Size</th>
                                <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Status</th>
                                <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Created</th>
                                <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest text-right whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-5 py-12 text-center">
                                    <p className="text-sm text-offgray-500 animate-pulse">Loading deployments...</p>
                                </td></tr>
                            ) : deployments.length === 0 ? (
                                <tr><td colSpan={5} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-offgray-600">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-offgray-400">No deployments yet</p>
                                        <p className="text-[11px] font-mono text-offgray-600">Click &quot;New Deployment&quot; to upload your first file.</p>
                                    </div>
                                </td></tr>
                            ) : deployments.map((file) => (
                                <tr
                                    key={file.id}
                                    className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group/row"
                                    onClick={() => router.push(`/studio/deployments/editor?id=${file.id}`)}
                                >
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-offgray-400 group-hover/row:border-emerald-500/20 group-hover/row:text-emerald-400 transition-colors">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-medium text-offgray-200 group-hover/row:text-white transition-colors">
                                                    {file.title}
                                                </span>
                                                <span className="text-[10px] font-mono text-offgray-600 truncate max-w-[200px]" title={file.deploy_key}>
                                                    {file.deploy_key}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <span className="text-[12px] font-mono text-offgray-400">{formatBytes(file.file_size)}</span>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap hidden sm:table-cell">
                                        <span className={`inline-flex items-center gap-1.5 h-5 px-1.5 rounded-[4px] text-[9px] font-mono tracking-widest uppercase border ${file.status === 'active' ? 'bg-[#059669]/20 text-[#10B981] border-[#10B981]/30' : 'bg-offgray-600/20 text-offgray-400 border-offgray-600/30'}`}>
                                            {file.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap hidden sm:table-cell">
                                        <span className="text-[11px] font-mono text-offgray-500">
                                            {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <DeploymentRowMenu
                                            deploymentId={file.id}
                                            isOpen={openMenuId === file.id}
                                            onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === file.id ? null : file.id); }}
                                            onEdit={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(null);
                                                router.push(`/studio/deployments/editor?id=${file.id}`);
                                            }}
                                            onCopyUrl={(e) => {
                                                e.stopPropagation();
                                                // Create a public URL pointing to our backend's redirect endpoint
                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
                                                const publicUrl = `${apiUrl}/v1/${file.deploy_key}`; navigator.clipboard.writeText(publicUrl);
                                                setOpenMenuId(null);
                                            }}
                                            onDelete={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(null);
                                                handleDelete(file.id);
                                            }}
                                            onClose={() => setOpenMenuId(null)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                    <p className="text-[11px] font-mono text-offgray-600">
                        {totalCount > 0 ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, totalCount)} of ${totalCount}` : "No deployments"}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fetchDeployments(Math.max(1, page - 1), searchQuery)}
                            disabled={page <= 1}
                            className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => fetchDeployments(Math.min(totalPages, page + 1), searchQuery)}
                            disabled={page >= totalPages}
                            className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {/* Create File Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-[#0a0c10] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-serif text-white">Create New File</h3>
                                <p className="text-sm font-mono text-offgray-500">Enter a title for your new deployment.</p>
                            </div>
                            <input
                                type="text"
                                placeholder="My Awesome Script"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="w-full h-10 px-4 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm font-mono text-white placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>
                        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.04] flex gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 h-10 rounded-lg border border-white/[0.08] text-xs font-mono text-offgray-300 hover:text-white hover:bg-white/[0.02] transition-all">
                                Cancel
                            </button>
                            <button
                                disabled={!newFileName.trim()}
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    router.push(`/studio/deployments/editor?name=${encodeURIComponent(newFileName.trim())}`);
                                }}
                                className="flex-1 h-10 rounded-lg bg-[#059669] hover:bg-[#10B981] text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Create &amp; Open Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="relative p-4 sm:p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-300 group overflow-hidden">
            <div className="space-y-2 relative z-10">
                <p className="flex items-center gap-2 text-[10px] font-mono font-semibold text-offgray-500/80 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 shrink-0 rounded-sm bg-offgray-600/50 group-hover:bg-offgray-400 transition-colors" />
                    {label}
                </p>
                <p className="text-2xl md:text-3xl font-serif tracking-tight text-white">{value}</p>
            </div>
        </div>
    );
}

function DeploymentRowMenu({ deploymentId, isOpen, onToggle, onEdit, onCopyUrl, onDelete, onClose }: {
    deploymentId: string;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onEdit: (e: React.MouseEvent) => void;
    onCopyUrl: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.top - 8,
                left: rect.right - 144,
            });
        }
    }, [isOpen]);

    return (
        <div className="relative inline-flex justify-end">
            <button
                ref={btnRef}
                onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />

                    <div
                        className="fixed z-[70] w-36 py-1 bg-[#12151a] border border-white/[0.08] rounded-lg shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: 'translateY(-100%)' }}
                    >
                        <button
                            onClick={onEdit}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={onCopyUrl}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Copy URL
                        </button>
                        <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy Key
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
