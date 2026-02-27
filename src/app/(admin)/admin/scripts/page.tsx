"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminScript {
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    likes: number;
    is_paid: boolean;
    owner_username: string;
    owner_display_name: string;
    hub_name: string | null;
    created_at: string;
}

const TABS = [
    { label: "All", value: "" },
    { label: "Under Review", value: "under_review" },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
];

const statusColor = (s: string) => {
    if (s === "published") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "draft") return "bg-white/[0.04] text-offgray-500 border-white/[0.06]";
    if (s === "under_review") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

// ── Fixed-position actions menu (same pattern as studio/deployments) ──────────
function ScriptRowMenu({ script, isOpen, onToggle, onStatusChange, onDelete, onClose }: {
    script: AdminScript;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (s: AdminScript) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top - 8, left: rect.right - 208 });
        }
    }, [isOpen]);

    const act = (fn: () => void) => { fn(); onClose(); };

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
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />

                    {/* Menu — fixed, opens upward */}
                    <div
                        className="fixed z-[70] w-52 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}
                    >
                        {/* Approve */}
                        {script.status !== "published" && (
                            <button onClick={() => act(() => onStatusChange(script.id, "published"))}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Approve & Publish
                            </button>
                        )}

                        {/* Mark under review (from draft) */}
                        {script.status === "draft" && (
                            <button onClick={() => act(() => onStatusChange(script.id, "under_review"))}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-yellow-400 hover:text-yellow-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                Mark Under Review
                            </button>
                        )}

                        {/* Reject back to draft */}
                        {script.status !== "draft" && (
                            <button onClick={() => act(() => onStatusChange(script.id, "draft"))}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 14-4-4 4-4" /><path d="M5 10h11a4 4 0 0 1 0 8h-1" />
                                </svg>
                                Reject to Draft
                            </button>
                        )}

                        <div className="my-1 border-t border-white/[0.04]" />

                        <button onClick={() => act(() => onDelete(script))}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete Script
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminScriptsPage() {
    const router = useRouter();
    const [scripts, setScripts] = useState<AdminScript[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [total, setTotal] = useState(0);
    const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const loadScripts = useCallback(async (q: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            if (status) params.set("status", status);
            const r = await apiClient.get(`/admin/scripts?${params}`);
            setScripts(r.data.data?.scripts ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load scripts.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load count for "under_review" badge
    const loadTabCounts = useCallback(async () => {
        try {
            const r = await apiClient.get(`/admin/scripts?status=under_review&limit=0`);
            setTabCounts({ under_review: r.data.data?.total ?? 0 });
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) { router.replace("/home"); return; }
        loadTabCounts();
    }, [router, loadTabCounts]);

    useEffect(() => {
        const t = setTimeout(() => loadScripts(search, activeTab), search === "" ? 0 : 350);
        return () => clearTimeout(t);
    }, [search, activeTab, loadScripts]);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/admin/scripts/${id}/status`, { status });
            if (activeTab && status !== activeTab) {
                setScripts(prev => prev.filter(s => s.id !== id));
                setTotal(prev => prev - 1);
            } else {
                setScripts(prev => prev.map(s => s.id === id ? { ...s, status } : s));
            }
            loadTabCounts();
        } catch { alert("Failed to update status."); }
    };

    const handleDelete = async (script: AdminScript) => {
        if (!confirm(`Delete "${script.title}"? This is a soft-delete.`)) return;
        try {
            await apiClient.delete(`/admin/scripts/${script.id}`);
            setScripts(prev => prev.filter(s => s.id !== script.id));
            setTotal(prev => prev - 1);
        } catch { alert("Failed to delete script."); }
    };

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500">
            {/* Title + search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">Script Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">
                        {isLoading ? "Loading…" : `${total} scripts`}
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Search title, slug, owner…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64"
                />
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={[
                            "px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2 flex items-center gap-2",
                            activeTab === tab.value
                                ? "text-rose-300 border-rose-500 bg-rose-500/5"
                                : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]",
                        ].join(" ")}
                    >
                        {tab.label}
                        {tab.value === "under_review" && (tabCounts.under_review ?? 0) > 0 && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-mono leading-none">
                                {tabCounts.under_review}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">⚠ {error}</div>}

            {/* Table — NO overflow-hidden so fixed-position menus aren't clipped */}
            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["Title", "Owner", "Hub", "Status", "Views", "Likes", "Type", "Created", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : scripts.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No scripts {activeTab ? `with status "${activeTab.replace("_", " ")}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                scripts.map(s => (
                                    <tr key={s.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="font-medium text-offgray-100 truncate">{s.title}</p>
                                            <p className="text-[10px] font-mono text-offgray-600 truncate">{s.slug}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-offgray-300 text-[12px]">{s.owner_display_name || s.owner_username}</p>
                                            <p className="text-[10px] font-mono text-offgray-600">@{s.owner_username}</p>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-500 text-[12px] whitespace-nowrap">{s.hub_name || "—"}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(s.status)}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-400 whitespace-nowrap">{(s.views ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-offgray-400 whitespace-nowrap">{(s.likes ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {s.is_paid
                                                ? <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">paid</span>
                                                : <span className="text-[10px] font-mono text-offgray-700">free</span>}
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">
                                            {s.created_at ? new Date(s.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
                                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                            <ScriptRowMenu
                                                script={s}
                                                isOpen={openMenuId === s.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id); }}
                                                onStatusChange={handleStatusChange}
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
