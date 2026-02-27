"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface UserPlan {
    id: string;
    user_id: string;
    plan_type: string;
    started_at: string;
    expires_at: string | null;
    created_at: string;
    username: string;
    display_name: string;
    email: string;
    maximum_obfuscation: number;
    maximum_keys: number;
    maximum_deployments: number;
    maximum_devices_per_key: number;
    maximums_reset_at: string | null;
}

const PLAN_TABS = [
    { label: "All", value: "" },
    { label: "Free", value: "free" },
    { label: "Pro", value: "pro" },
    { label: "Enterprise", value: "enterprise" },
    { label: "Custom", value: "custom" },
];

const planColor = (p: string) => {
    if (p === "custom") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (p === "enterprise") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (p === "pro") return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    return "bg-offgray-500/10 text-offgray-400 border-offgray-500/20";
};

// ── Fixed-position row menu ───────────────────────────────────────────────────
function PlanRowMenu({ plan, isOpen, onToggle, onPlanChange, onCustomEdit, onClose }: {
    plan: UserPlan;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onPlanChange: (id: string, planType: string) => void;
    onCustomEdit: (plan: UserPlan) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top - 8, left: rect.right - 180 });
        }
    }, [isOpen]);

    const allPlans = ["free", "pro", "enterprise", "custom"] as const;

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
                    <div className="fixed z-[70] w-52 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}>

                        <p className="px-3 py-1.5 text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Quick Set</p>

                        {allPlans.filter(p => p !== plan.plan_type).map(p => (
                            <button key={p} onClick={(e) => { e.stopPropagation(); onPlanChange(plan.id, p); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                                <span className={`w-2 h-2 rounded-full ${p === "custom" ? "bg-rose-400" : p === "enterprise" ? "bg-amber-400" : p === "pro" ? "bg-violet-400" : "bg-offgray-500"}`} />
                                Set to <span className="font-bold capitalize">{p}</span>
                            </button>
                        ))}

                        <div className="my-1 border-t border-white/[0.04]" />

                        <button onClick={(e) => { e.stopPropagation(); onCustomEdit(plan); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            Custom Edit…
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Custom Edit Modal ─────────────────────────────────────────────────────────
function CustomEditModal({ plan, onSave, onClose }: {
    plan: UserPlan;
    onSave: (id: string, data: { plan_type: string; expires_at: string | null; custom_maximums: { deployments: number; keys: number; obfuscation: number; devicesPerKey: number } }) => void;
    onClose: () => void;
}) {
    const [planType, setPlanType] = useState(plan.plan_type);
    const [deployments, setDeployments] = useState(String(plan.maximum_deployments ?? 0));
    const [keys, setKeys] = useState(String(plan.maximum_keys ?? 0));
    const [obfuscation, setObfuscation] = useState(String(plan.maximum_obfuscation ?? 0));
    const [devicesPerKey, setDevicesPerKey] = useState(String(plan.maximum_devices_per_key ?? 1));
    const [expiresAt, setExpiresAt] = useState(plan.expires_at ? new Date(plan.expires_at).toISOString().slice(0, 10) : "");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        await onSave(plan.id, {
            plan_type: planType,
            expires_at: expiresAt || null,
            custom_maximums: {
                deployments: parseInt(deployments) || 0,
                keys: parseInt(keys) || 0,
                obfuscation: parseInt(obfuscation) || 0,
                devicesPerKey: parseInt(devicesPerKey) || 1,
            },
        });
        setSaving(false);
    };

    const inputClass = "w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 outline-none focus:border-rose-500/30 transition-all font-mono";
    const labelClass = "text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest mb-1.5";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md bg-[#0c0e13] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                    <h3 className="text-base font-semibold text-white">Edit Plan — @{plan.username}</h3>
                    <p className="text-[11px] font-mono text-offgray-600 mt-1">{plan.display_name || plan.username} · {plan.email}</p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Plan Type */}
                    <div>
                        <p className={labelClass}>Plan Tier</p>
                        <div className="flex gap-2">
                            {(["free", "pro", "enterprise", "custom"] as const).map(p => (
                                <button key={p} onClick={() => setPlanType(p)}
                                    className={[
                                        "flex-1 py-2 rounded-lg text-[12px] font-mono font-bold border transition-all capitalize",
                                        planType === p
                                            ? p === "custom" ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                : p === "enterprise" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                                    : p === "pro" ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                                                        : "bg-white/[0.06] text-offgray-200 border-white/[0.12]"
                                            : "bg-white/[0.02] text-offgray-600 border-white/[0.04] hover:border-white/[0.08] hover:text-offgray-400"
                                    ].join(" ")}>{p}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <p className={labelClass}>🚀 Deploys</p>
                            <input type="number" min="0" value={deployments} onChange={e => setDeployments(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <p className={labelClass}>🔑 Keys</p>
                            <input type="number" min="0" value={keys} onChange={e => setKeys(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <p className={labelClass}>🔒 Obfusc.</p>
                            <input type="number" min="0" value={obfuscation} onChange={e => setObfuscation(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <p className={labelClass}>📱 Dev/Key</p>
                            <input type="number" min="1" value={devicesPerKey} onChange={e => setDevicesPerKey(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <p className={labelClass}>Expires At</p>
                        <div className="flex gap-2">
                            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                className={`${inputClass} flex-1`} />
                            {expiresAt && (
                                <button onClick={() => setExpiresAt("")}
                                    className="h-9 px-3 rounded-lg text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                                    ∞ Lifetime
                                </button>
                            )}
                        </div>
                        {!expiresAt && <p className="text-[10px] font-mono text-offgray-600 mt-1">No expiry — plan lasts forever.</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
                    <button onClick={onClose}
                        className="h-9 px-4 rounded-lg text-[13px] font-medium text-offgray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div >
    );
}

export default function AdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<UserPlan[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);

    const load = useCallback(async (q: string, planType: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            if (planType) params.set("plan_type", planType);
            const r = await apiClient.get(`/admin/plans?${params}`);
            setPlans(r.data.data?.plans ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load plans.");
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

    const handlePlanChange = async (id: string, planType: string) => {
        try {
            await apiClient.patch(`/admin/plans/${id}`, { plan_type: planType });
            load(search, activeTab);
        } catch {
            alert("Failed to update user plan.");
        }
    };

    const handleCustomSave = async (id: string, data: { plan_type: string; expires_at: string | null; custom_maximums: { deployments: number; keys: number; obfuscation: number } }) => {
        try {
            await apiClient.patch(`/admin/plans/${id}`, data);
            setEditingPlan(null);
            load(search, activeTab);
        } catch {
            alert("Failed to update user plan.");
        }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const isExpired = (d: string | null) => d ? new Date() > new Date(d) : false;

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">Plan Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">{isLoading ? "Loading…" : `${total} user plans`}</p>
                </div>
                <input type="text" placeholder="Search username, email…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {PLAN_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={["px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2",
                            activeTab === tab.value ? "text-rose-300 border-rose-500 bg-rose-500/5" : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]"
                        ].join(" ")}>{tab.label}</button>
                ))}
            </div>

            {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">⚠ {error}</div>}

            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["User", "Plan", "Limits", "Started", "Expires", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : plans.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No plans{activeTab ? ` with type "${activeTab}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                plans.map(p => (
                                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="font-medium text-offgray-100 truncate">{p.display_name || p.username}</p>
                                            <p className="text-[10px] font-mono text-offgray-600 truncate">@{p.username}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${planColor(p.plan_type)}`}>{p.plan_type}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 text-[10px] font-mono">
                                                <span className="text-offgray-400" title="Deployments">🚀 {p.maximum_deployments ?? 0}</span>
                                                <span className="text-offgray-400" title="Keys">🔑 {p.maximum_keys ?? 0}</span>
                                                <span className="text-offgray-400" title="Obfuscation">🔒 {p.maximum_obfuscation ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">
                                            {formatDate(p.started_at)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {p.expires_at ? (
                                                <span className={`text-[11px] font-mono ${isExpired(p.expires_at) ? "text-rose-400" : "text-offgray-500"}`}>
                                                    {isExpired(p.expires_at) ? "⚠ " : ""}{formatDate(p.expires_at)}
                                                </span>
                                            ) : (
                                                <span className="text-offgray-700 font-mono text-[11px]">∞ lifetime</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2" onClick={ev => ev.stopPropagation()}>
                                            <PlanRowMenu plan={p} isOpen={openMenuId === p.id}
                                                onToggle={(ev) => { ev.stopPropagation(); setOpenMenuId(openMenuId === p.id ? null : p.id); }}
                                                onPlanChange={handlePlanChange}
                                                onCustomEdit={(plan) => setEditingPlan(plan)}
                                                onClose={() => setOpenMenuId(null)} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Edit Modal */}
            {editingPlan && (
                <CustomEditModal
                    plan={editingPlan}
                    onSave={handleCustomSave}
                    onClose={() => setEditingPlan(null)}
                />
            )}
        </div>
    );
}
