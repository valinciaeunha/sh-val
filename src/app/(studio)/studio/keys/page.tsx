"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { keysApi, type LicenseKey, type KeyWithDevices, type KeyStats, type KeySettings, type ScriptOption } from "@/lib/api/keys";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";
import Link from 'next/link';

// ============================================
// Helpers
// ============================================

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "—";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(mins / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    return formatDate(dateStr);
}

function maskHwid(hwid: string): string {
    if (hwid.length <= 8) return hwid;
    return hwid.slice(0, 4) + "••••" + hwid.slice(-4);
}

function maskIp(ip: string): string {
    const parts = ip.split(".");
    if (parts.length === 4) return parts[0] + "." + parts[1] + ".••.••";
    return ip;
}

const TYPE_DISPLAY: Record<string, string> = {
    lifetime: "Lifetime",
    timed: "Timed",
    device_locked: "Device Locked",
};

const STATUS_DISPLAY: Record<string, string> = {
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
    unused: "Unused",
};

// ============================================
// Main Component
// ============================================

export default function StudioKeysPage() {
    // Data state
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [stats, setStats] = useState<KeyStats | null>(null);
    const [settings, setSettings] = useState<KeySettings | null>(null);
    const [scripts, setScripts] = useState<ScriptOption[]>([]);
    const [totalKeys, setTotalKeys] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedKey, setSelectedKey] = useState<KeyWithDevices | null>(null);
    const [devicePanelOpen, setDevicePanelOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterScriptId, setFilterScriptId] = useState<string>("all");
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

    // Plans & Maximums
    const [planData, setPlanData] = useState<PlanWithMaximums | null>(null);

    // ============================================
    // Data fetching
    // ============================================

    const fetchKeys = useCallback(async (p = 1, statusFilter = "all", scriptFilter = "all") => {
        try {
            const params: any = { page: p, limit: 20 };
            if (statusFilter !== "all") params.status = statusFilter;
            if (scriptFilter !== "all") params.scriptId = scriptFilter;
            const result = await keysApi.getMyKeys(params);
            setKeys(result.keys);
            setTotalKeys(result.total);
            setPage(result.page);
            setTotalPages(result.totalPages);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const s = await keysApi.getStats();
            setStats(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const s = await keysApi.getSettings();
            setSettings(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchScripts = useCallback(async () => {
        try {
            const s = await keysApi.getScripts();
            setScripts(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchPlanData = useCallback(async () => {
        try {
            const p = await plansApi.getMyPlan();
            setPlanData(p);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // Initial load for mostly static data
    useEffect(() => {
        let mounted = true;
        const loadInitial = async () => {
            if (!mounted) return;
            await Promise.all([fetchStats(), fetchSettings(), fetchScripts(), fetchPlanData()]);
        };
        loadInitial();
        return () => { mounted = false; };
    }, []);

    // Re-fetch keys when filters or initial render occurs
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchKeys(1, filterStatus, filterScriptId).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, [filterStatus, filterScriptId]);

    // ============================================
    // Actions
    // ============================================

    const openDevicePanel = useCallback(async (key: LicenseKey) => {
        try {
            const full = await keysApi.getKeyById(key.id);
            setSelectedKey(full);
            setDevicePanelOpen(true);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const closeDevicePanel = useCallback(() => {
        setDevicePanelOpen(false);
        setTimeout(() => setSelectedKey(null), 300);
    }, []);

    const handleRevoke = useCallback(async (keyId: string) => {
        try {
            await keysApi.revokeKey(keyId);
            fetchKeys(page);
            fetchStats();
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleDelete = useCallback(async (keyId: string) => {
        try {
            await keysApi.deleteKey(keyId);
            fetchKeys(page);
            fetchStats();
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleRevokeDevice = useCallback(async (keyId: string, deviceId: string) => {
        try {
            await keysApi.revokeDevice(keyId, deviceId);
            // Refresh the panel
            const full = await keysApi.getKeyById(keyId);
            setSelectedKey(full);
            fetchKeys(page);
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys]);

    const handleUpdateSettings = useCallback(async (key: string, value: boolean | number) => {
        if (!settings) return;
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await keysApi.updateSettings({
                deviceLockEnabled: newSettings.device_lock_enabled,
                maxDevicesPerKey: newSettings.max_devices_per_key,
                rateLimitingEnabled: newSettings.rate_limiting_enabled,
                autoExpireEnabled: newSettings.auto_expire_enabled,
                hwidBlacklistEnabled: newSettings.hwid_blacklist_enabled,
            });
        } catch (err) {
            // error silently handled
            fetchSettings(); // revert on error
        }
    }, [settings, fetchSettings]);

    const handleGenerated = useCallback(() => {
        setGenerateModalOpen(false);
        fetchKeys(1);
        fetchStats();
        fetchPlanData(); // Re-fetch plan data to update credits
    }, [fetchKeys, fetchStats, fetchPlanData]);

    const handleGenerateApiKey = useCallback(async () => {
        try {
            const updated = await keysApi.generateApiKey();
            setSettings(updated);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // ============================================
    // Render
    // ============================================

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* ============================================ */}
                {/* Header */}
                {/* ============================================ */}
                <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                            Key System
                        </h1>
                        <p className="text-sm font-mono text-offgray-500 max-w-lg">
                            Manage license access, device bindings, and validation security.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setGenerateModalOpen(true)}
                            className="group relative inline-flex items-center justify-center gap-2 h-9 px-5 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span className="relative z-10">Generate Keys</span>
                        </button>
                    </div>
                </section>

                {/* ============================================ */}
                {/* Section 1: Analytics Cards */}
                {/* ============================================ */}
                <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative p-4 sm:p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-300 group overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                        <div className="space-y-2 relative z-10">
                            <p className="flex items-center gap-2 text-[10px] font-mono font-semibold text-emerald-500/80 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 shrink-0 rounded-sm bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" />
                                Maximum Keys
                            </p>
                            <div className="flex items-center gap-3">
                                <p className="text-2xl md:text-3xl font-serif tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-emerald-200 transition-all">
                                    {planData?.maximums.maximum_keys.toLocaleString() ?? "0"}
                                </p>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 leading-none">
                                        {Math.max(0, (planData?.maximums.maximum_keys ?? 0) - ((stats?.total_active ?? 0) + (stats?.total_unused ?? 0))).toLocaleString()} available
                                    </span>
                                </div>
                            </div>
                            {planData?.plan.expires_at && new Date(planData.plan.expires_at) < new Date() && (
                                <p className="text-[10px] font-mono text-rose-400 mt-1 capitalize">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
                                    Plan Expired (Downgraded to Free)
                                </p>
                            )}
                        </div>
                    </div>
                    <StatCard label="Total Active Keys" value={stats?.total_active?.toLocaleString() ?? "0"} trend="+0%" trendUp />
                    <StatCard label="Expired Keys" value={stats?.total_expired?.toLocaleString() ?? "0"} trend="+0%" trendUp={false} />
                    <StatCard label="Revoked Keys" value={stats?.total_revoked?.toLocaleString() ?? "0"} trend="+0%" trendUp={false} />
                    <StatCard label="Active Devices" value={stats?.total_devices?.toLocaleString() ?? "0"} trend="+0%" trendUp />
                </section>

                {/* ============================================ */}
                {/* Section 2: Keys Table */}
                {/* ============================================ */}
                <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group/table">
                    {/* Table Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    {/* Table Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">License Keys</h2>
                            <span className="text-[10px] font-mono text-offgray-600 bg-white/[0.04] rounded-full px-2 py-0.5">{totalKeys} keys</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-mono transition-all border ${filterDropdownOpen || filterStatus !== "all" || filterScriptId !== "all" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/[0.03] border-white/[0.06] text-offgray-400 hover:border-white/[0.12] hover:bg-white/[0.05]"}`}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                                    Filters
                                    {(filterStatus !== "all" || filterScriptId !== "all") && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                                    )}
                                </button>
                                {filterDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                                        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 py-3 space-y-4">
                                            {/* Status Option */}
                                            <div className="px-4 space-y-2">
                                                <label className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest pl-1">Key Status</label>
                                                <select
                                                    value={filterStatus}
                                                    onChange={(e) => setFilterStatus(e.target.value)}
                                                    className="w-full h-8 px-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="all">Any Status</option>
                                                    <option value="active">Active</option>
                                                    <option value="unused">Unused</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="revoked">Revoked</option>
                                                </select>
                                            </div>

                                            {/* Script Option */}
                                            <div className="px-4 space-y-2">
                                                <label className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest pl-1">Target Script</label>
                                                <select
                                                    value={filterScriptId}
                                                    onChange={(e) => setFilterScriptId(e.target.value)}
                                                    className="w-full h-8 px-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="all">All Scripts</option>
                                                    {scripts.map(s => (
                                                        <option key={s.id} value={s.id}>{s.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {(filterStatus !== "all" || filterScriptId !== "all") && (
                                                <div className="px-4 pt-2 border-t border-white/[0.04]">
                                                    <button
                                                        onClick={() => { setFilterStatus("all"); setFilterScriptId("all"); }}
                                                        className="w-full h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-[11px] font-mono font-semibold transition-colors"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search keys..."
                                    className="h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs font-mono text-offgray-300 placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all w-44"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Key ID</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Script</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Type</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Devices</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Expires</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Last Activity</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest text-right whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="px-5 py-12 text-center text-sm font-mono text-offgray-500">Loading keys...</td></tr>
                                ) : keys.length === 0 ? (
                                    <tr><td colSpan={8} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-offgray-600">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-offgray-400">No keys generated yet</p>
                                            <p className="text-[11px] font-mono text-offgray-600">Click &quot;Generate Keys&quot; to create your first license key.</p>
                                        </div>
                                    </td></tr>
                                ) : keys.map((key) => (
                                    <tr
                                        key={key.id}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group/row"
                                        onClick={() => openDevicePanel(key)}
                                    >
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[12px] font-mono font-medium text-offgray-200 group-hover/row:text-white transition-colors" title={key.key_value}>
                                                {key.key_value.length > 20 ? key.key_value.slice(0, 20) + "…" : key.key_value}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[12px] text-offgray-400">{key.script_name}</span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <TypeBadge type={key.type} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <DeviceCount used={key.devices_used} max={key.max_devices} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <StatusBadge status={key.status} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[11px] font-mono text-offgray-500">{formatDate(key.expires_at)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[11px] font-mono text-offgray-500">{timeAgo(key.last_activity_at)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <RowActionMenu
                                                keyId={key.id}
                                                isOpen={openMenuId === key.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === key.id ? null : key.id); }}
                                                onView={(e) => { e.stopPropagation(); setOpenMenuId(null); openDevicePanel(key); }}
                                                onRevoke={(e) => { e.stopPropagation(); setOpenMenuId(null); handleRevoke(key.id); }}
                                                onDelete={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDelete(key.id); }}
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
                            {keys.length > 0 ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, totalKeys)} of ${totalKeys}` : "No keys"}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchKeys(Math.max(1, page - 1), filterStatus, filterScriptId)}
                                disabled={page <= 1}
                                className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => fetchKeys(Math.min(totalPages, page + 1), filterStatus, filterScriptId)}
                                disabled={page >= totalPages}
                                className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* Section 3: Security Controls */}
                {/* ============================================ */}
                <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="px-5 py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            </svg>
                            <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">Security Controls</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.03]">
                        {/* Moved API Key Settings */}
                        <div className="px-5 py-4 hover:bg-white/[0.015] transition-colors">
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                <div className="shrink-0 text-blue-400 mt-0.5">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-blue-400 text-sm">API Key Moved</h4>
                                    <p className="text-xs text-blue-300/80 leading-relaxed max-w-lg mb-3">
                                        Your Developer API Key is no longer tied strictly to license keys. It has been promoted to a global account setting to support all future integrations.
                                    </p>
                                    <Link href="/studio/api" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-colors">
                                        Manage API Key
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <ToggleRow
                            title="Enable Device Lock"
                            description="Tie license keys to specific hardware identifiers (HWID)."
                            enabled={settings?.device_lock_enabled ?? true}
                            onToggle={() => handleUpdateSettings("device_lock_enabled", !(settings?.device_lock_enabled ?? true))}
                        />
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.015] transition-colors">
                            <div className="space-y-0.5">
                                <p className="text-[13px] font-medium text-offgray-200">Max Devices Per Key</p>
                                <p className="text-[11px] font-mono text-offgray-500">Maximum HWIDs per key. Your plan allows up to {planData?.maximums.maximum_devices_per_key ?? 1}.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUpdateSettings("max_devices_per_key", Math.max(1, (settings?.max_devices_per_key ?? 1) - 1))}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono"
                                >
                                    −
                                </button>
                                <span className="text-sm font-mono font-semibold text-white w-6 text-center">{settings?.max_devices_per_key ?? 1}</span>
                                <button
                                    onClick={() => {
                                        const limit = planData?.maximums.maximum_devices_per_key ?? 1;
                                        handleUpdateSettings("max_devices_per_key", Math.min(limit, (settings?.max_devices_per_key ?? 1) + 1));
                                    }}
                                    disabled={(settings?.max_devices_per_key ?? 1) >= (planData?.maximums.maximum_devices_per_key ?? 1)}
                                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <ToggleRow
                            title="Enable Rate Limiting"
                            description="Prevent rapid key validation requests from a single IP."
                            enabled={settings?.rate_limiting_enabled ?? true}
                            onToggle={() => handleUpdateSettings("rate_limiting_enabled", !(settings?.rate_limiting_enabled ?? true))}
                        />
                        <ToggleRow
                            title="Auto Expire Keys"
                            description="Automatically expire keys that have not been used for 90 days."
                            enabled={settings?.auto_expire_enabled ?? false}
                            onToggle={() => handleUpdateSettings("auto_expire_enabled", !(settings?.auto_expire_enabled ?? false))}
                        />
                        <ToggleRow
                            title="Global HWID Blacklist"
                            description="Block specific hardware identifiers from activating any key."
                            enabled={settings?.hwid_blacklist_enabled ?? false}
                            onToggle={() => handleUpdateSettings("hwid_blacklist_enabled", !(settings?.hwid_blacklist_enabled ?? false))}
                        />
                    </div>
                </section>


            </div>

            {/* ============================================ */}
            {/* Device Activity Panel (Side Drawer) */}
            {/* ============================================ */}

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${devicePanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={closeDevicePanel}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#0b0d12] border-l border-white/[0.06] shadow-2xl transition-transform duration-300 ease-out ${devicePanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                {selectedKey && (
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-white">Device Activity</h3>
                                <p className="text-[12px] font-mono text-offgray-500">{selectedKey.key_value}</p>
                            </div>
                            <button
                                onClick={closeDevicePanel}
                                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Key Info Summary */}
                        <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Script</p>
                                    <p className="text-[13px] text-offgray-200">{selectedKey.script_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Type</p>
                                    <TypeBadge type={selectedKey.type} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Status</p>
                                    <StatusBadge status={selectedKey.status} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Expires</p>
                                    <p className="text-[13px] font-mono text-offgray-300">{formatDate(selectedKey.expires_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Device List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Bound Devices ({selectedKey.devices?.length ?? 0}/{selectedKey.max_devices})
                                </p>
                            </div>

                            {(!selectedKey.devices || selectedKey.devices.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-offgray-400">No devices bound</p>
                                    <p className="text-[11px] font-mono text-offgray-600 mt-1">This key has not been activated yet.</p>
                                </div>
                            ) : (
                                selectedKey.devices.map((device) => (
                                    <div key={device.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-colors group/device">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
                                                    </svg>
                                                </div>
                                                <span className="text-[12px] font-mono font-medium text-offgray-200">{maskHwid(device.hwid)}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeDevice(selectedKey.id, device.id)}
                                                className="opacity-0 group-hover/device:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-wider px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">IP Address</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{maskIp(device.ip_address || "—")}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">First Seen</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{formatDate(device.first_seen_at)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">Last Seen</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{timeAgo(device.last_seen_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
                            <button
                                onClick={() => navigator.clipboard.writeText(selectedKey.key_value)}
                                className="flex-1 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                            >
                                Copy Key
                            </button>
                            <button
                                onClick={() => { handleRevoke(selectedKey.id); closeDevicePanel(); }}
                                className="flex-1 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                            >
                                Revoke Key
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generate Key Modal */}
            <GenerateKeyModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                scripts={scripts}
                onGenerated={handleGenerated}
                availableQuota={Math.max(0, (planData?.maximums.maximum_keys ?? 0) - ((stats?.total_active ?? 0) + (stats?.total_unused ?? 0)))}
                planType={planData?.plan.plan_type ?? "free"}
                maxDeviceLimit={planData?.maximums.maximum_devices_per_key ?? 1}
            />
        </>
    );
}

// ============================================
// Generate Key Modal
// ============================================

function GenerateKeyModal({ isOpen, onClose, scripts, onGenerated, availableQuota, planType, maxDeviceLimit }: {
    isOpen: boolean;
    onClose: () => void;
    scripts: ScriptOption[];
    onGenerated: () => void;
    availableQuota: number;
    planType: string;
    maxDeviceLimit: number;
}) {
    const [scriptId, setScriptId] = useState("");
    const canUseLifetime = planType === "custom";
    const [keyType, setKeyType] = useState<"lifetime" | "timed" | "device_locked">(canUseLifetime ? "lifetime" : "timed");
    const [maxDevices, setMaxDevices] = useState(1);
    const [expiryDays, setExpiryDays] = useState(30);
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");
    const [generating, setGenerating] = useState(false);
    const [scriptDropdownOpen, setScriptDropdownOpen] = useState(false);
    const [scriptSearch, setScriptSearch] = useState("");
    const filteredScripts = scripts.filter((s) => s.title.toLowerCase().includes(scriptSearch.toLowerCase()));
    const selectedScript = scripts.find((s) => s.id === scriptId);

    const handleGenerate = async () => {
        if (!scriptId || quantity > availableQuota) return;
        setGenerating(true);
        try {
            await keysApi.generateKeys({
                scriptId,
                type: keyType,
                maxDevices,
                quantity,
                expiresInDays: keyType === "timed" ? expiryDays : undefined,
                note: note || undefined,
            });
            // Reset form
            setScriptId("");
            setKeyType("lifetime");
            setMaxDevices(1);
            setExpiryDays(30);
            setQuantity(1);
            setNote("");
            onGenerated();
        } catch (err) {
            // error silently handled
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="relative w-full max-w-lg bg-[#0b0d12] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-white">Generate Keys</h3>
                            <p className="text-[11px] font-mono text-offgray-500">Create new license keys for a script.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Target Script</label>
                            <div className="relative">
                                {/* Selected / Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setScriptDropdownOpen(!scriptDropdownOpen)}
                                    className={`w-full h-9 px-3 bg-white/[0.03] border rounded-lg text-[13px] font-mono outline-none transition-all flex items-center justify-between gap-2 ${scriptDropdownOpen ? "border-emerald-500/30 ring-1 ring-emerald-500/10" : "border-white/[0.08] hover:border-white/[0.12]"
                                        }`}
                                >
                                    {selectedScript ? (
                                        <span className="text-offgray-200 truncate">{selectedScript.title}</span>
                                    ) : (
                                        <span className="text-offgray-500">Select a script...</span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {selectedScript && (
                                            <span
                                                onClick={(e) => { e.stopPropagation(); setScriptId(""); }}
                                                className="w-4 h-4 rounded flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </span>
                                        )}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-offgray-500 transition-transform duration-200 ${scriptDropdownOpen ? "rotate-180" : ""}`}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Dropdown */}
                                {scriptDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => { setScriptDropdownOpen(false); setScriptSearch(""); }} />
                                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                            {/* Search input */}
                                            <div className="p-2 border-b border-white/[0.04]">
                                                <div className="relative">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={scriptSearch}
                                                        onChange={(e) => setScriptSearch(e.target.value)}
                                                        placeholder="Search scripts..."
                                                        className="w-full h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 placeholder:text-offgray-600 outline-none focus:border-emerald-500/20"
                                                    />
                                                </div>
                                            </div>
                                            {/* Options list */}
                                            <div className="max-h-44 overflow-y-auto py-1">
                                                {filteredScripts.length === 0 ? (
                                                    <p className="px-3 py-4 text-center text-[11px] font-mono text-offgray-600">No scripts found</p>
                                                ) : (
                                                    filteredScripts.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setScriptId(s.id);
                                                                setScriptDropdownOpen(false);
                                                                setScriptSearch("");
                                                            }}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono transition-colors ${scriptId === s.id
                                                                ? "text-emerald-400 bg-emerald-500/[0.06]"
                                                                : "text-offgray-300 hover:text-white hover:bg-white/[0.04]"
                                                                }`}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
                                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                                                            </svg>
                                                            <span className="truncate">{s.title}</span>
                                                            {scriptId === s.id && (
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-emerald-400">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Key Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["lifetime", "timed", "device_locked"] as const).map((type) => {
                                    const isLifetimeLocked = type === "lifetime" && !canUseLifetime;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => !isLifetimeLocked && setKeyType(type)}
                                            disabled={isLifetimeLocked}
                                            title={isLifetimeLocked ? "Lifetime keys require a Custom plan" : undefined}
                                            className={`h-9 rounded-lg text-[11px] font-mono font-semibold border transition-all ${isLifetimeLocked
                                                ? "bg-white/[0.01] border-white/[0.04] text-offgray-600 cursor-not-allowed opacity-50"
                                                : keyType === type
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    : "bg-white/[0.02] border-white/[0.06] text-offgray-400 hover:border-white/[0.12] hover:text-offgray-200"
                                                }`}
                                        >
                                            {TYPE_DISPLAY[type]}
                                            {isLifetimeLocked && " 🔒"}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Max Devices <span className="text-offgray-600">(max {maxDeviceLimit})</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMaxDevices((v) => Math.max(1, v - 1))} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono">−</button>
                                    <span className="text-sm font-mono font-semibold text-white w-8 text-center">{maxDevices}</span>
                                    <button onClick={() => setMaxDevices((v) => Math.min(maxDeviceLimit, v + 1))} disabled={maxDevices >= maxDeviceLimit} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Expires In {keyType !== "timed" && <span className="text-offgray-600">(N/A)</span>}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                                        disabled={keyType !== "timed"}
                                        className="w-full h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-offgray-200 font-mono outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-[11px] font-mono text-offgray-500 shrink-0">days</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Quantity</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={1000}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.08] accent-emerald-500 cursor-pointer"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-20 h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-white font-mono text-center outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                                />
                            </div>
                            {quantity > 1000 && (
                                <p className="text-[10px] font-mono text-amber-400 flex items-center gap-1.5">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
                                    </svg>
                                    Large batches may take a few seconds to process.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Note <span className="text-offgray-600">(optional)</span></label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Giveaway batch #12"
                                className="w-full h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-offgray-200 font-mono placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
                        <div className="flex flex-col">
                            <p className="text-[11px] font-mono text-offgray-500">
                                {quantity.toLocaleString()} key{quantity !== 1 ? "s" : ""} will be generated
                            </p>
                            <p className={`text-[10px] font-mono mt-0.5 ${quantity > availableQuota ? 'text-rose-400 font-semibold' : 'text-emerald-500/80'}`}>
                                Quota: {availableQuota.toLocaleString()} remaining slots
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!scriptId || generating || quantity > availableQuota}
                                className="group relative h-9 px-5 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#059669]"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    {generating ? "Generating..." : quantity > availableQuota ? "Limit Exceeded" : "Generate"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ label, value, trend, trendUp }: { label: string; value: string; trend: string; trendUp: boolean }) {
    return (
        <div className="relative p-4 sm:p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="space-y-2 relative z-10">
                <p className="flex items-center gap-2 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 shrink-0 rounded-sm bg-white/10 group-hover:bg-emerald-500/50 transition-colors" />
                    {label}
                </p>
                <div className="flex items-baseline gap-2.5">
                    <p className="text-2xl md:text-3xl font-serif tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-offgray-400 transition-all">
                        {value}
                    </p>
                    <span className={`text-[10px] font-mono font-medium ${trendUp ? "text-emerald-500" : "text-amber-400"}`}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
        expired: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
        revoked: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
        unused: "text-offgray-400 bg-white/[0.04] border-white/[0.08]",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border shadow-sm ${styles[status] || styles.unused}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-400 animate-pulse" : status === "expired" ? "bg-amber-400" : status === "revoked" ? "bg-rose-400" : "bg-offgray-500"}`} />
            {STATUS_DISPLAY[status] || status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        lifetime: "text-sky-300 bg-sky-500/10 border-sky-500/15",
        timed: "text-violet-300 bg-violet-500/10 border-violet-500/15",
        device_locked: "text-orange-300 bg-orange-500/10 border-orange-500/15",
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border uppercase tracking-wider ${styles[type] || ""}`}>
            {TYPE_DISPLAY[type] || type}
        </span>
    );
}

function DeviceCount({ used, max }: { used: number; max: number }) {
    const percentage = max > 0 ? (used / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${percentage >= 100 ? "bg-rose-400" : percentage >= 66 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-[11px] font-mono text-offgray-400">{used}/{max}</span>
        </div>
    );
}

function RowActionMenu({ keyId, isOpen, onToggle, onView, onRevoke, onDelete, onClose }: {
    keyId: string;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onView: (e: React.MouseEvent) => void;
    onRevoke: (e: React.MouseEvent) => void;
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
                            onClick={onView}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <circle cx="12" cy="12" r="3" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            </svg>
                            View
                        </button>
                        <button
                            onClick={onRevoke}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M18.36 6.64A9 9 0 0 1 20.77 15" /><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" /><path d="m2 2 20 20" />
                            </svg>
                            Revoke
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

function ToggleRow({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.015] transition-colors">
            <div className="space-y-0.5 mr-4">
                <p className="text-[13px] font-medium text-offgray-200">{title}</p>
                <p className="text-[11px] font-mono text-offgray-500">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={`relative shrink-0 w-10 h-[22px] rounded-full transition-colors duration-300 ${enabled ? "bg-emerald-500" : "bg-white/[0.08]"}`}
            >
                <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? "left-[22px]" : "left-[3px]"}`} />
            </button>
        </div>
    );
}
