"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminKey {
    id: string;
    key_value: string;
    type: string;
    status: string;
    max_devices: number;
    expires_at: string | null;
    last_activity_at: string | null;
    created_at: string;
    note: string | null;
    owner_username: string;
    owner_display_name: string;
    script_title: string | null;
    script_slug: string | null;
}

const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Expired", value: "expired" },
];

const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "expired") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-white/[0.04] text-offgray-500 border-white/[0.06]";
};

const typeColor = (t: string) => {
    if (t === "permanent") return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
};

// ── Fixed-position row menu ───────────────────────────────────────────────────
function KeyRowMenu({ k, isOpen, onToggle, onDelete, onClose }: {
    k: AdminKey;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onDelete: (k: AdminKey) => void;
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
            <button ref={btnRef} onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                    <div className="fixed z-[70] w-40 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(k.key_value); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy Key
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button onClick={(e) => { e.stopPropagation(); onDelete(k); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Revoke Key
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminKeysPage() {
    const router = useRouter();
    const [keys, setKeys] = useState<AdminKey[]>([]);
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
            const r = await apiClient.get(`/admin/keys?${params}`);
            setKeys(r.data.data?.keys ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load keys.");
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

    const handleDelete = async (k: AdminKey) => {
        if (!confirm(`Revoke key "${k.key_value.slice(0, 16)}…"? This cannot be undone.`)) return;
        try {
            await apiClient.delete(`/admin/keys/${k.id}`);
            setKeys(prev => prev.filter(x => x.id !== k.id));
            setTotal(prev => prev - 1);
        } catch { alert("Failed to revoke key."); }
    };

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID") : "—";
    const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">License Key Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">{isLoading ? "Loading…" : `${total} keys`}</p>
                </div>
                <input type="text" placeholder="Search key, owner, script…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {STATUS_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={["px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2",
                            activeTab === tab.value ? "text-rose-300 border-rose-500 bg-rose-500/5" : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]"
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
                                {["Key", "Owner", "Script", "Type", "Devices", "Status", "Expires", "Last Active", "Created", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={10} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : keys.length === 0 ? (
                                <tr><td colSpan={10} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No keys{activeTab ? ` with status "${activeTab}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                keys.map(k => (
                                    <tr key={k.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                        <td className="px-4 py-3">
                                            <code className="text-[10px] font-mono text-offgray-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                                {k.key_value?.slice(0, 18)}{k.key_value?.length > 18 ? "…" : ""}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-offgray-300 text-[12px]">{k.owner_display_name || k.owner_username}</p>
                                            <p className="text-[10px] font-mono text-offgray-600">@{k.owner_username}</p>
                                        </td>
                                        <td className="px-4 py-3 max-w-[140px]">
                                            <p className="text-offgray-400 text-[12px] truncate">{k.script_title || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${typeColor(k.type)}`}>{k.type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-400 text-center">{k.max_devices ?? "∞"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(k.status)}`}>{k.status}</span>
                                        </td>
                                        <td className={`px-4 py-3 font-mono text-[11px] whitespace-nowrap ${isExpired(k.expires_at) ? "text-rose-400" : "text-offgray-500"}`}>
                                            {k.expires_at ? fmt(k.expires_at) : <span className="text-offgray-700">never</span>}
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">{fmt(k.last_activity_at)}</td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">{fmt(k.created_at)}</td>
                                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                            <KeyRowMenu k={k} isOpen={openMenuId === k.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === k.id ? null : k.id); }}
                                                onDelete={handleDelete} onClose={() => setOpenMenuId(null)} />
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
