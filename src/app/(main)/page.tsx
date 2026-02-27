"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";

interface PlatformStats {
  scripts: number;
  developers: number;
  deployments: number;
  games: number;
  hubs: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/stats');
        setStats(res.data.data);
      } catch (err) {
        // silently handled
      }
    };
    fetchStats();
  }, []);

  const displayStats = [
    { value: stats ? stats.scripts.toLocaleString() : '...', label: 'Scripts' },
    { value: stats ? stats.developers.toLocaleString() : '...', label: 'Developers' },
    { value: stats ? stats.games.toLocaleString() : '...', label: 'Games' },
    { value: stats ? stats.hubs.toLocaleString() : '...', label: 'Hubs' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-6 pt-2">
        <div className="space-y-3">
          <h1 className="heading-base text-3xl md:text-[40px] leading-tight">
            Script<span className="text-emerald-400">Hub</span>
          </h1>
          <p className="text-sm md:text-[15px] text-offgray-400 max-w-lg leading-relaxed">
            The open platform for <span className="text-emerald-400">Lua</span> script creators.
            Publish, distribute, and monetize your scripts with built-in CDN deployments,
            license key systems, and community hubs.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-[13px] font-medium transition-colors duration-100"
          >
            Get Started
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center h-9 px-5 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-offgray-200 text-[13px] font-medium transition-colors duration-100"
          >
            Browse Scripts
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
          {displayStats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-1 md:gap-6">
              <div>
                <span className="text-[10px] sm:text-base md:text-lg font-medium text-offgray-50 font-mono tabular-nums">{stat.value}</span>
                <span className="text-[9px] sm:text-xs text-offgray-600 ml-0.5 md:ml-1.5">{stat.label}</span>
              </div>
              {i < displayStats.length - 1 && <div className="hidden sm:block w-px h-3 md:h-4 bg-border-subtle" />}
              {i < displayStats.length - 1 && <div className="sm:hidden w-0.5 h-0.5 rounded-full bg-offgray-700 mx-0.5" />}
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Features */}
      <section className="space-y-5">
        <div>
          <h2 className="heading-base text-xl">Everything you need</h2>
          <p className="text-xs text-offgray-600 mt-1">
            Purpose-built infrastructure for Lua script developers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              title: "Community Script Library",
              desc: "Browse 15,000+ scripts organized by game, category, and trust rating. Every script is linked to a verified creator.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              ),
            },
            {
              title: "CDN Deployments",
              desc: "Upload once. ScriptHub handles obfuscation, global CDN distribution, and immutable URLs. Sub-100ms delivery.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              ),
            },
            {
              title: "License Key System",
              desc: "Generate and manage access keys with expiry, device limits, and real-time usage analytics via API.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              ),
            },
            {
              title: "Creator Hubs",
              desc: "Build a hub around your scripts. Group files, manage members, and give your community a branded home.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22 8.5 12 15.5 2 8.5" />
                </svg>
              ),
            },
            {
              title: "Studio Dashboard",
              desc: "Real traffic, deployment health, key usage, and quota status all in one developer dashboard.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
            {
              title: "Executor Registry",
              desc: "Track supported executors per script, maintain version compatibility, and inform users what works.",
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 9l3 3-3 3" />
                  <path d="M13 15h3" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-emerald-500/30"
            >
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                {feature.icon}
              </div>
              <h3 className="text-[15px] font-medium text-offgray-50 mb-1.5 group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs text-offgray-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* How it works */}
      <section className="space-y-5">
        <div>
          <h2 className="heading-base text-xl">How it works</h2>
          <p className="text-xs text-offgray-600 mt-1">
            From upload to player in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              step: "01",
              title: "Upload your script",
              desc: "Write in Lua, upload in the Studio. ScriptHub handles sanitization, obfuscation, and versioning.",
            },
            {
              step: "02",
              title: "Configure distribution",
              desc: "Set your script as public, hub-only, or key-gated. Deploy to CDN for instant-load URLs.",
            },
            {
              step: "03",
              title: "Track everything",
              desc: "Real-time view counts, key usage, CDN requests, and download analytics in your dashboard.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <span className="inline-block text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mb-3">
                {item.step}
              </span>
              <h3 className="text-[15px] font-medium text-offgray-50 mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-offgray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Pricing — coming soon */}
      <section className="space-y-5">
        <div>
          <h2 className="heading-base text-xl">Pricing</h2>
          <p className="text-xs text-offgray-600 mt-1">
            Pricing plans coming soon. ScriptHub is currently free for all developers.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <p className="text-sm text-offgray-400">We&apos;re working on Pro and Enterprise plans.</p>
          <p className="text-xs text-offgray-600">All features are currently available for free during early access.</p>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Final CTA */}
      <section className="text-center py-8 space-y-4">
        <h2 className="heading-base text-xl">Ready to ship?</h2>
        <p className="text-sm text-offgray-500 max-w-md mx-auto">
          Join 2,400+ developers building on ScriptHub. Free to start, upgrade when you&apos;re ready.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-[13px] font-medium transition-colors duration-100"
          >
            Browse Scripts
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
