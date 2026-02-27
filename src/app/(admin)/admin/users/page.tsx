"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminUser {
    id: string;
    username: string;
    display_name: string;
    email: string;
    account_status: string;
    roles: string[];
    providers: string[];
    created_at: string;
    bio?: string;
}

const AVAILABLE_ROLES = ["user", "moderator", "admin"];
const AVAILABLE_STATUSES = ["active", "suspended"];

// ── Small reusable modal wrapper ──────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-[#0f1115] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="text-offgray-500 hover:text-white transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

// ── 3-dot dropdown ────────────────────────────────────────────────────────────
function ActionsDropdown({ user, onAction }: { user: AdminUser; onAction: (action: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="p-1.5 rounded-md hover:bg-white/[0.06] text-offgray-500 hover:text-white transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-8 w-48 bg-[#0f1115] border border-white/[0.08] rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={() => { onAction("edit"); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-offgray-200 hover:bg-white/[0.04] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                        Edit User
                    </button>
                    <button onClick={() => { onAction("roles"); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-offgray-200 hover:bg-white/[0.04] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Change Roles
                    </button>
                    <div className="my-1 border-t border-white/[0.06]" />
                    {user.account_status === "active" ? (
                        <button onClick={() => { onAction("suspend"); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-yellow-400 hover:bg-white/[0.04] transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></svg>
                            Suspend
                        </button>
                    ) : (
                        <button onClick={() => { onAction("activate"); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-emerald-400 hover:bg-white/[0.04] transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            Activate
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Modals
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [rolesUser, setRolesUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ username: "", email: "", display_name: "", bio: "", avatar_url: "" });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const loadUsers = useCallback(async (q: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            const r = await apiClient.get(`/admin/users?${params}`);
            setUsers(r.data.data?.users ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load users.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) { router.replace("/home"); return; }
    }, [router]);

    useEffect(() => {
        const t = setTimeout(() => loadUsers(search), search === "" ? 0 : 350);
        return () => clearTimeout(t);
    }, [search, loadUsers]);

    const handleAction = (user: AdminUser, action: string) => {
        if (action === "edit") {
            setEditForm({ username: user.username, email: user.email || "", display_name: user.display_name || "", bio: user.bio || "", avatar_url: "" });
            setEditUser(user);
        } else if (action === "roles") {
            setSelectedRoles(user.roles || []);
            setRolesUser(user);
        } else if (action === "suspend") {
            changeStatus(user.id, "suspended");
        } else if (action === "activate") {
            changeStatus(user.id, "active");
        }
    };

    const changeStatus = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/admin/users/${id}/status`, { status });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, account_status: status } : u));
        } catch { alert("Failed to update status."); }
    };

    const saveEdit = async () => {
        if (!editUser) return;
        setSaving(true);
        try {
            const body: Record<string, string> = {};
            if (editForm.username) body.username = editForm.username;
            if (editForm.email) body.email = editForm.email;
            if (editForm.display_name) body.display_name = editForm.display_name;
            if (editForm.bio !== undefined) body.bio = editForm.bio;
            if (editForm.avatar_url) body.avatar_url = editForm.avatar_url;
            await apiClient.patch(`/admin/users/${editUser.id}`, body);
            setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...body, display_name: body.display_name || u.display_name } : u));
            setEditUser(null);
        } catch { alert("Failed to save changes."); }
        finally { setSaving(false); }
    };

    const saveRoles = async () => {
        if (!rolesUser) return;
        setSaving(true);
        try {
            await apiClient.patch(`/admin/users/${rolesUser.id}/roles`, { roles: selectedRoles });
            setUsers(prev => prev.map(u => u.id === rolesUser.id ? { ...u, roles: selectedRoles } : u));
            setRolesUser(null);
        } catch { alert("Failed to update roles."); }
        finally { setSaving(false); }
    };

    const toggleRole = (role: string) => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

    const statusColor = (s: string) => {
        if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (s === "suspended") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    };

    return (
        <>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif text-white">User Management</h1>
                        <p className="text-sm text-offgray-500 mt-1 font-mono">
                            {isLoading ? "Loading…" : `${total} users`}
                        </p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64"
                    />
                </div>

                {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">⚠ {error}</div>}

                <div className="rounded-xl border border-white/[0.04] overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["ID", "User", "Email", "Login", "Roles", "Status", "Joined", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">No users match your search.</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-4 py-3 font-mono text-[10px] text-offgray-600" title={u.id}>{u.id?.slice(0, 8)}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-offgray-100">{u.display_name || u.username}</p>
                                            <p className="text-[11px] font-mono text-offgray-600">@{u.username}</p>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-500 text-[12px]">{u.email || "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {(u.providers || []).map((p: string) => (
                                                    <span key={p} title={p} className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${p === "discord" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                        p === "google" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                            "bg-white/[0.04] text-offgray-500 border-white/[0.06]"
                                                        }`}>
                                                        {p === "discord" ? (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
                                                        ) : p === "google" ? (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                                        ) : (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                                        )} {p}
                                                    </span>
                                                ))}
                                                {(u.providers || []).length === 0 && <span className="text-offgray-700 font-mono text-[10px]">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(u.roles || []).map((r: string) => (
                                                    <span key={r} className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${r === "admin" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : r === "moderator" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/[0.04] text-offgray-500 border-white/[0.06]"}`}>{r}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(u.account_status)}`}>{u.account_status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px]">{u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "—"}</td>
                                        <td className="px-4 py-2 text-right">
                                            <ActionsDropdown user={u} onAction={(action) => handleAction(u, action)} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Edit User Modal ── */}
            {editUser && (
                <Modal title={`Edit @${editUser.username}`} onClose={() => setEditUser(null)}>
                    <div className="space-y-3">
                        {[
                            { label: "Username", key: "username" },
                            { label: "Email", key: "email" },
                            { label: "Display Name", key: "display_name" },
                            { label: "Bio", key: "bio" },
                            { label: "Avatar URL", key: "avatar_url" },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="block text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest mb-1">{label}</label>
                                <input
                                    value={editForm[key as keyof typeof editForm]}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 outline-none focus:border-rose-500/30 transition-all"
                                />
                            </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                            <button onClick={saveEdit} disabled={saving}
                                className="flex-1 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[13px] font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-50">
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                            <button onClick={() => setEditUser(null)} className="h-9 px-4 rounded-lg bg-white/[0.04] text-offgray-400 text-[13px] hover:bg-white/[0.08] transition-colors">Cancel</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Change Roles Modal ── */}
            {rolesUser && (
                <Modal title={`Roles — @${rolesUser.username}`} onClose={() => setRolesUser(null)}>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            {AVAILABLE_ROLES.map((role) => (
                                <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedRoles.includes(role) ? "bg-rose-500/10 border-rose-500/20" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"}`}>
                                    <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggleRole(role)} className="accent-rose-500" />
                                    <span className={`text-[13px] font-medium ${selectedRoles.includes(role) ? "text-rose-300" : "text-offgray-300"}`}>{role}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={saveRoles} disabled={saving}
                                className="flex-1 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[13px] font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-50">
                                {saving ? "Saving…" : "Apply Roles"}
                            </button>
                            <button onClick={() => setRolesUser(null)} className="h-9 px-4 rounded-lg bg-white/[0.04] text-offgray-400 text-[13px] hover:bg-white/[0.08] transition-colors">Cancel</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
