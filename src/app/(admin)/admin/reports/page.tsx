"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface ReportRow {
    date: string;
    new_users: number;
    new_scripts: number;
    total_views: number;
}

export default function AdminReportsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !user?.roles?.includes("admin")) {
            router.replace("/home");
            return;
        }
        apiClient
            .get("/admin/reports?days=30")
            .then((r) => setRows(r.data.data?.rows ?? []))
            .catch(() => setError("Backend /admin/reports not implemented yet."))
            .finally(() => setIsLoading(false));
    }, [router]);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-serif text-white">Reports</h1>
                <p className="text-sm text-offgray-500 mt-1 font-mono">Platform activity — last 30 days</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono">
                    ⚠ {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                </div>
            ) : rows.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Placeholder cards when no data */}
                    {[
                        { label: "New Users (30d)", value: "—" },
                        { label: "New Scripts (30d)", value: "—" },
                        { label: "Total Views (30d)", value: "—" },
                    ].map((s) => (
                        <div key={s.label} className="relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
                            <p className="text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{s.label}</p>
                            <p className="text-3xl font-serif tracking-tight text-white mt-2">{s.value}</p>
                        </div>
                    ))}
                    <div className="col-span-full text-center text-offgray-600 font-mono text-sm py-8 border border-white/[0.04] rounded-xl">
                        Backend /admin/reports endpoint not implemented yet.
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary row */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "New Users (30d)", value: rows.reduce((s, r) => s + (r.new_users ?? 0), 0) },
                            { label: "New Scripts (30d)", value: rows.reduce((s, r) => s + (r.new_scripts ?? 0), 0) },
                            { label: "Total Views (30d)", value: rows.reduce((s, r) => s + (r.total_views ?? 0), 0) },
                        ].map((s) => (
                            <div key={s.label} className="relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group hover:border-rose-500/20 transition-all">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{s.label}</p>
                                <p className="text-3xl font-serif tracking-tight text-white mt-2">{s.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Daily table */}
                    <div className="rounded-xl border border-white/[0.04] overflow-hidden">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                    {["Date", "New Users", "New Scripts", "Views"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {rows.map((row) => (
                                    <tr key={row.date} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-4 py-3 text-offgray-400 font-mono text-[11px]">{row.date}</td>
                                        <td className="px-4 py-3 text-offgray-200">{row.new_users ?? 0}</td>
                                        <td className="px-4 py-3 text-offgray-200">{row.new_scripts ?? 0}</td>
                                        <td className="px-4 py-3 text-offgray-200">{(row.total_views ?? 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
