"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminDeployment {
    id: string;
    title: string;
    deploy_key: string;
    file_size: number;
    mime_type: string;
    status: string;
    cdn_requests: number;
    owner_username: string;
    owner_display_name: string;
    created_at: string;
}

const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
];

const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "inactive") return "bg-white/[0.04] text-offgray-500 border-white/[0.06]";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ── Fixed-position row menu (same pattern as studio/deployments) ──────────────
function DeploymentRowMenu({ dep, isOpen, onToggle, onDelete, onClose }: {
    dep: AdminDeployment;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onDelete: (d: AdminDeployment) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top - 8, left: rect.right - 160 });
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
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                    <div
                        className="fixed z-[70] w-40 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(dep.deploy_key); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy Key
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(dep); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDeploymentsPage() {
    const router = useRouter();
    const [deployments, setDeployments] = useState<AdminDeployment[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const load = useCallback(async (q: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            if (status) params.set("status", status);
            const r = await apiClient.get(`/admin/deployments?${params}`);
            setDeployments(r.data.data?.deployments ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load deployments.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) { router.replace("/home"); return; }
    }, [router]);

    useEffect(() => {
        const t = setTimeout(() => load(search, activeTab), search === "" ? 0 : 350);
        return () => clearTimeout(t);
    }, [search, activeTab, load]);

    const handleDelete = async (dep: AdminDeployment) => {
        if (!confirm(`Delete deployment "${dep.title}"? This cannot be undone.`)) return;
        try {
            await apiClient.delete(`/admin/deployments/${dep.id}`);
            setDeployments(prev => prev.filter(d => d.id !== dep.id));
            setTotal(prev => prev - 1);
        } catch { alert("Failed to delete deployment."); }
    };

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">Deployment Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">{isLoading ? "Loading…" : `${total} deployments`}</p>
                </div>
                <input
                    type="text"
                    placeholder="Search title, key, owner…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {STATUS_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={[
                            "px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2",
                            activeTab === tab.value
                                ? "text-rose-300 border-rose-500 bg-rose-500/5"
                                : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]",
                        ].join(" ")}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">⚠ {error}</div>}

            {/* Table */}
            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["Title", "Owner", "Deploy Key", "Size", "MIME", "CDN Req.", "Status", "Created", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : deployments.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No deployments{activeTab ? ` with status "${activeTab}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                deployments.map(d => (
                                    <tr key={d.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <p className="font-medium text-offgray-100 truncate">{d.title}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-offgray-300 text-[12px]">{d.owner_display_name || d.owner_username}</p>
                                            <p className="text-[10px] font-mono text-offgray-600">@{d.owner_username}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-[10px] font-mono text-offgray-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                                {d.deploy_key?.slice(0, 16)}{d.deploy_key?.length > 16 ? "…" : ""}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-400 font-mono text-[11px] whitespace-nowrap">{formatBytes(d.file_size)}</td>
                                        <td className="px-4 py-3 text-offgray-500 text-[11px] font-mono whitespace-nowrap">{d.mime_type || "—"}</td>
                                        <td className="px-4 py-3 text-offgray-400 whitespace-nowrap">{(d.cdn_requests ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(d.status)}`}>{d.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">
                                            {d.created_at ? new Date(d.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
                                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                            <DeploymentRowMenu
                                                dep={d}
                                                isOpen={openMenuId === d.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id); }}
                                                onDelete={handleDelete}
                                                onClose={() => setOpenMenuId(null)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
