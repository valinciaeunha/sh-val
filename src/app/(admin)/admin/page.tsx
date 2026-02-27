"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminStats {
    totalUsers: number;
    totalScripts: number;
    totalDeployments: number;
    totalKeys: number;
}

export default function AdminOverviewPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) {
            router.replace("/home");
            return;
        }
        apiClient
            .get("/admin/stats")
            .then((r) => setStats(r.data.data))
            .catch(() => setError("Backend /admin/stats not implemented yet."))
            .finally(() => setIsLoading(false));
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
        );
    }

    const quickLinks = [
        { label: "Users", href: "/admin/users", desc: "Manage all registered users", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { label: "Scripts", href: "/admin/scripts", desc: "Review & moderate scripts", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
        { label: "Deployments", href: "/admin/deployments", desc: "System-wide deployments", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /><path d="M12 2v4" /></svg> },
        { label: "Keys", href: "/admin/keys", desc: "All license keys", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.74V17l1 1 1-1v-1h1v-1h1v-2.26c1.8-1.25 3-3.35 3-5.74a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="1" fill="currentColor" /></svg> },
        { label: "Hubs", href: "/admin/hubs", desc: "Manage community hubs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" /><line x1="12" y1="22" x2="12" y2="15.5" /><polyline points="22 8.5 12 15.5 2 8.5" /></svg> },
        { label: "Executors", href: "/admin/executors", desc: "Executor registry", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
        { label: "Plans", href: "/admin/plans", desc: "Configure subscription plans", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.57a2.41 2.41 0 0 0 3.41 0l7.59-7.57a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z" /></svg> },
        { label: "Reports", href: "/admin/reports", desc: "Platform activity & stats", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-serif text-white">Admin Overview</h1>
                <p className="text-sm text-offgray-500 mt-1 font-mono">System-wide statistics and quick access</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">
                    ⚠ {error}
                </div>
            )}

            {/* Stats grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: stats?.totalUsers ?? "—" },
                    { label: "Total Scripts", value: stats?.totalScripts ?? "—" },
                    { label: "Deployments", value: stats?.totalDeployments ?? "—" },
                    { label: "License Keys", value: stats?.totalKeys ?? "—" },
                ].map((s) => (
                    <div key={s.label} className="relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group hover:border-rose-500/20 transition-all">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{s.label}</p>
                        <p className="text-3xl font-serif tracking-tight text-white mt-2">{String(s.value)}</p>
                    </div>
                ))}
            </section>

            {/* Quick links */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickLinks.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group flex flex-col gap-3 p-4 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:border-rose-500/20 transition-all"
                    >
                        <div className="p-2 rounded-lg bg-white/[0.03] w-fit group-hover:bg-rose-500/10 transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-offgray-100 group-hover:text-white transition-colors">{item.label}</p>
                            <p className="text-[10px] font-mono text-offgray-600 mt-0.5">{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
