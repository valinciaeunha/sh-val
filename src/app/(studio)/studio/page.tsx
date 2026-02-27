"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { usersApi, type DashboardStats } from "@/lib/api/users";
import { deploymentsApi, type DeploymentStats } from "@/lib/api/deployments";
import { keysApi, type KeyStats } from "@/lib/api/keys";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";

function formatBytes(bytes: number | undefined | null) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function StudioOverviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [scriptStats, setScriptStats] = useState<DashboardStats | null>(null);
  const [deployStats, setDeployStats] = useState<DeploymentStats | null>(null);
  const [keyStats, setKeyStats] = useState<KeyStats | null>(null);
  const [plan, setPlan] = useState<PlanWithMaximums | null>(null);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push("/home");
      return;
    }

    const loadData = async () => {
      try {
        const userData = authApi.getStoredUser();
        setUser(userData);

        const [scripts, deploys, keys, planData] = await Promise.allSettled([
          usersApi.getDashboardStats(),
          deploymentsApi.getStats(),
          keysApi.getStats(),
          plansApi.getMyPlan(),
        ]);

        if (scripts.status === "fulfilled") setScriptStats(scripts.value);
        if (deploys.status === "fulfilled") setDeployStats(deploys.value);
        if (keys.status === "fulfilled") setKeyStats(keys.value);
        if (planData.status === "fulfilled") setPlan(planData.value);
      } catch (error) {
        // error silently handled
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-offgray-500 uppercase tracking-widest">Initializing...</p>
        </div>
      </div>
    );
  }

  const maxDeploys = plan?.maximums?.maximum_deployments ?? 3;
  const usedDeploys = deployStats?.active_deployments ?? 0;
  const deployPct = maxDeploys > 0 ? Math.min(100, (usedDeploys / maxDeploys) * 100) : 0;

  const maxKeys = plan?.maximums?.maximum_keys ?? 0;
  const usedKeys = (keyStats?.total_active ?? 0) + (keyStats?.total_unused ?? 0);
  const keyPct = maxKeys > 0 ? Math.min(100, (usedKeys / maxKeys) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0a0c10]/80 px-6 py-14 text-center flex flex-col items-center justify-center shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" style={{ backgroundSize: "30px 30px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-50" />
        <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-light text-transparent bg-clip-text bg-gradient-to-b from-[#8EE2B8] to-[#10B981]">
            Welcome back, {user?.displayName || user?.username}
          </h1>
          <p className="text-offgray-400 text-sm font-mono tracking-wide">
            Manage your scripts, keys, and deployments from one place.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link href="/studio/scripts/new" className="group relative inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              New Script
            </Link>
            <Link href="/studio/deployments/upload" className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Upload Deployment
            </Link>
            <Link href="/studio/keys" className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
              Manage Keys
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Scripts */}
        <Link href="/studio/scripts" className="group relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-offgray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/40 group-hover:bg-emerald-400 transition-colors" />
                Scripts
              </p>
              <svg width="14" height="14" className="text-offgray-600 group-hover:text-emerald-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <p className="text-3xl font-serif tracking-tight text-white">{scriptStats?.totalScripts?.toLocaleString() ?? "—"}</p>
            <div className="flex gap-4 text-[10px] font-mono text-offgray-600">
              <span>{(scriptStats?.totalViews ?? 0).toLocaleString()} views</span>
              <span>{(scriptStats?.totalDownloads ?? 0).toLocaleString()} downloads</span>
            </div>
          </div>
        </Link>

        {/* Deployments */}
        <Link href="/studio/deployments" className="group relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-offgray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/40 group-hover:bg-emerald-400 transition-colors" />
                Deployments
              </p>
              <svg width="14" height="14" className="text-offgray-600 group-hover:text-emerald-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
            </div>
            <p className="text-3xl font-serif tracking-tight text-white">{usedDeploys.toLocaleString()}</p>
            <div className="space-y-1.5">
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${deployPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-offgray-600">
                <span>{formatBytes(Number(deployStats?.total_size ?? 0))}</span>
                <span>{usedDeploys} / {maxDeploys} slots</span>
              </div>
            </div>
          </div>
        </Link>

        {/* License Keys */}
        <Link href="/studio/keys" className="group relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-offgray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/40 group-hover:bg-emerald-400 transition-colors" />
                License Keys
              </p>
              <svg width="14" height="14" className="text-offgray-600 group-hover:text-emerald-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
            </div>
            <p className="text-3xl font-serif tracking-tight text-white">{usedKeys.toLocaleString()}</p>
            <div className="space-y-1.5">
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${keyPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-offgray-600">
                <span className="text-emerald-600">{keyStats?.total_active ?? 0} active</span>
                <span>{usedKeys} / {maxKeys === 0 ? "∞" : maxKeys} limit</span>
              </div>
            </div>
          </div>
        </Link>

        {/* CDN Requests */}
        <Link href="/studio/deployments" className="group relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-offgray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/40 group-hover:bg-emerald-400 transition-colors" />
                CDN Requests
              </p>
              <svg width="14" height="14" className="text-offgray-600 group-hover:text-emerald-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <p className="text-3xl font-serif tracking-tight text-white">{(deployStats?.cdn_requests ?? 0).toLocaleString()}</p>
            <div className="flex gap-4 text-[10px] font-mono text-offgray-600">
              <span>{deployStats?.active_deployments ?? 0} active files</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Plan Banner + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Plan Quota */}
        <div className="lg:col-span-1 relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden">
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-offgray-100">Current Plan</p>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {plan?.plan?.plan_type || "Free"}
              </span>
            </div>
            <div className="space-y-2.5">
              <QuotaRow label="Scripts" used={scriptStats?.totalScripts ?? 0} max={null} />
              <QuotaRow label="Deployments" used={usedDeploys} max={maxDeploys} />
              <QuotaRow label="License Keys" used={usedKeys} max={maxKeys || null} />
            </div>
            <Link href="/studio/plans" className="mt-2 block text-center py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.04] transition-all">
              Manage Plan →
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/studio/scripts",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" /></svg>
              ),
              label: "Scripts",
              desc: "Manage & publish scripts",
            },
            {
              href: "/studio/deployments",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /><path d="M12 2v4" /></svg>
              ),
              label: "Deployments",
              desc: "Host files via CDN",
            },
            {
              href: "/studio/keys",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.74V17l1 1 1-1v-1h1v-1h1v-2.26c1.8-1.25 3-3.35 3-5.74a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="1" fill="currentColor" /></svg>
              ),
              label: "License Keys",
              desc: "Generate & manage keys",
            },
            {
              href: "/studio/hubs",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" /><line x1="12" y1="22" x2="12" y2="15.5" /><polyline points="22 8.5 12 15.5 2 8.5" /></svg>
              ),
              label: "Hubs",
              desc: "Organize your community",
            },
            {
              href: "/studio/plans",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.57a2.41 2.41 0 0 0 3.41 0l7.59-7.57a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              ),
              label: "Plan",
              desc: "Upgrade your quota",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 p-4 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all"
            >
              <div className="p-2 rounded-lg bg-white/[0.03] w-fit group-hover:bg-emerald-500/10 transition-colors">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-offgray-100 group-hover:text-white transition-colors">{item.label}</p>
                <p className="text-[10px] font-mono text-offgray-600 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Script Performance Chart */}
      <section className="relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-2 mb-6">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <h2 className="text-sm font-semibold text-offgray-100">Script Views — Last 7 Days</h2>
        </div>
        <div className="h-[160px] w-full flex items-end justify-between gap-[3px] px-1 group/chart">
          {(() => {
            const days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              return d.toISOString().split("T")[0];
            });
            const chartData = days.map((date) => {
              const entry = scriptStats?.viewsHistory?.find((h) => h.date === date);
              return { date, views: entry ? entry.views : 0, dayName: new Date(date).toLocaleDateString("en-US", { weekday: "short" }) };
            });
            const maxViews = Math.max(...chartData.map((d) => d.views), 1);
            return chartData.map((d) => (
              <div key={d.date} className="w-full bg-[#11141A] rounded-t-[2px] relative group/bar flex flex-col justify-end group-hover/chart:bg-white/[0.02]">
                <div style={{ height: `${Math.max((d.views / maxViews) * 100, 1)}%` }} className="w-full bg-[#059669] group-hover/bar:bg-[#10B981] transition-all duration-300 rounded-t-[2px]">
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1a1d21] border border-white/[0.08] px-2 py-1 rounded text-[11px] font-mono text-white opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-10">
                    {d.views.toLocaleString()} views
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
        <div className="flex justify-between text-[9px] text-offgray-600 font-mono tracking-widest uppercase mt-3 px-1">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return <span key={i}>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>;
          })}
        </div>
      </section>

    </div>
  );
}

function QuotaRow({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max ? Math.min(100, (used / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-offgray-500">
        <span>{label}</span>
        <span>{used.toLocaleString()}{max ? ` / ${max.toLocaleString()}` : ""}</span>
      </div>
      {max ? (
        <div className="h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${pct >= 90 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
