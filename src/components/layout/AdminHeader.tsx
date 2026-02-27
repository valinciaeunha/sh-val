"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api/auth";

const ADMIN_NAV = [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Scripts", href: "/admin/scripts" },
    { label: "Deployments", href: "/admin/deployments" },
    { label: "Keys", href: "/admin/keys" },
    { label: "Hubs", href: "/admin/hubs" },
    { label: "Executors", href: "/admin/executors" },
    { label: "Plans", href: "/admin/plans" },
    { label: "Reports", href: "/admin/reports" },
];

export function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = authApi.getStoredUser();
        if (!authApi.isAuthenticated() || !stored?.roles?.includes("admin")) {
            router.replace("/home");
            return;
        }
        setUser(stored);
    }, [router]);

    return (
        <>
            <header className="sticky top-0 z-30 w-full border-b border-rose-500/10 bg-[#0a0c0f]/90 backdrop-blur-xl">
                <nav
                    aria-label="Admin navigation"
                    className="w-full mx-auto max-w-[1148px] px-4 md:px-6 h-14 flex items-center justify-between"
                >
                    {/* Left: Brand + Nav */}
                    <div className="flex items-center gap-5">
                        {/* Brand */}
                        <Link href="/admin" className="flex items-center gap-2 select-none">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="text-[15px] font-medium text-offgray-50 tracking-tight">
                                script<span className="text-rose-400">hub</span>
                            </span>
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5 ml-1">
                                Admin
                            </span>
                        </Link>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-5 bg-white/[0.08]" />

                        {/* Nav links */}
                        <div className="hidden md:flex items-center gap-1">
                            {ADMIN_NAV.map((item) => {
                                const isActive =
                                    item.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={[
                                            "text-[13px] tracking-tight rounded-md flex items-center h-8 px-3 transition-colors duration-100 select-none",
                                            isActive
                                                ? "text-white bg-rose-500/10 text-rose-300"
                                                : "text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04]",
                                        ].join(" ")}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/studio"
                            className="hidden sm:flex text-[12px] text-offgray-500 hover:text-offgray-200 transition-colors items-center gap-1.5"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Studio
                        </Link>
                        <Link
                            href="/home"
                            className="hidden sm:flex text-[12px] text-offgray-500 hover:text-offgray-200 transition-colors items-center gap-1.5"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Main site
                        </Link>

                        {/* Avatar */}
                        {isMounted && user && (
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xs font-medium text-rose-400">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className="md:hidden p-2 text-offgray-500 hover:text-offgray-200 rounded-md"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isMobileMenuOpen ? (
                                    <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
                                ) : (
                                    <><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></>
                                )}
                            </svg>
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-14 z-40 bg-[#0a0c0f]/95 backdrop-blur-xl border-t border-rose-500/10 p-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {ADMIN_NAV.map((item) => {
                            const isActive =
                                item.href === "/admin"
                                    ? pathname === "/admin"
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={[
                                        "text-[13px] tracking-tight rounded-md flex items-center h-10 px-3 transition-colors select-none",
                                        isActive
                                            ? "text-rose-300 bg-rose-500/10"
                                            : "text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04]",
                                    ].join(" ")}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="h-px bg-white/[0.06] my-3" />
                        <Link href="/studio" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] text-offgray-500 hover:text-offgray-200 flex items-center h-10 px-3 rounded-md">
                            ← Studio
                        </Link>
                        <Link href="/home" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] text-offgray-500 hover:text-offgray-200 flex items-center h-10 px-3 rounded-md">
                            ← Main site
                        </Link>
                    </nav>
                </div>
            )}
        </>
    );
}
