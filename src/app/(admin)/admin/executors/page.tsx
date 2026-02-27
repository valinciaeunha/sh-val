"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface Executor {
    id: string;
    name: string;
    slug: string;
    status: string;
    version_count: number;
    created_at: string;
}

const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "pending") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (s === "archived") return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

// ── Fixed-position row menu ───────────────────────────────────────────────────
function ExecutorRowMenu({ executor, isOpen, onToggle, onStatusChange, onClose }: {
    executor: Executor;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onStatusChange: (id: string, status: string) => void;
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
                    <div className="fixed z-[70] w-48 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}>

                        {/* Status Actions */}
                        {executor.status !== "active" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "active"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Approve Executor
                            </button>
                        )}
                        {executor.status !== "rejected" && executor.status !== "active" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "rejected"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Reject Executor
                            </button>
                        )}
                        {(executor.status === "active" || executor.status === "rejected") && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "archived"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-400 hover:text-offgray-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="5" x="2" y="4" rx="2" /><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" /><path d="M10 13h4" />
                                </svg>
                                Archive Executor
                            </button>
                        )}

                        <div className="my-1 border-t border-white/[0.04]" />

                        <button onClick={(e) => { e.stopPropagation(); window.open(`/e/${executor.slug}`, "_blank"); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View Executor
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdminExecutorsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) {
            router.replace("/home");
            return;
        }
        apiClient
            .get("/admin/executors")
            .then((r) => setExecutors(r.data.data.executors ?? []))
            .catch(() => setError("Failed to load executors."))
            .finally(() => setIsLoading(false));
    }, [router]);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/admin/executors/${id}/status`, { status });
            setExecutors(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        } catch {
            alert("Failed to update executor status.");
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif text-white">Executors</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">{executors.length} executors registered</p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">⚠ {error}</div>
            )}

            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                            {["Name", "Slug", "Status", "Versions", "Created", ""].map((h, i) => (
                                <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" /></td></tr>
                        ) : executors.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">No executors found.</td></tr>
                        ) : (
                            executors.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                    <td className="px-4 py-3 font-medium text-offgray-100">{e.name}</td>
                                    <td className="px-4 py-3 text-offgray-500 font-mono text-[11px]">{e.slug}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(e.status)}`}>{e.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-offgray-400">{e.version_count ?? 0}</td>
                                    <td className="px-4 py-3 text-offgray-600 font-mono text-[11px]">
                                        {e.created_at ? new Date(e.created_at).toLocaleDateString("id-ID") : "—"}
                                    </td>
                                    <td className="px-4 py-2" onClick={ev => ev.stopPropagation()}>
                                        <ExecutorRowMenu executor={e} isOpen={openMenuId === e.id}
                                            onToggle={(ev) => { ev.stopPropagation(); setOpenMenuId(openMenuId === e.id ? null : e.id); }}
                                            onStatusChange={handleStatusChange}
                                            onClose={() => setOpenMenuId(null)} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
