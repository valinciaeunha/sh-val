"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { authApi, User } from "@/lib/api/auth";
import { getStorageUrl } from "@/lib/utils/image";

const STUDIO_NAV = [
    { label: "Overview", href: "/studio" },
    { label: "My Scripts", href: "/studio/scripts" },
    { label: "Hubs", href: "/studio/hubs" },
    { label: "Executors", href: "/studio/executors" },
    { label: "Obfuscations", href: "/studio/obfuscate" },
    { label: "Deployments", href: "/studio/deployments" },
    { label: "Key Systems", href: "/studio/keys" },
    { label: "API", href: "/studio/api" },
    { label: "Plans", href: "/studio/plans" },
];

export function StudioHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsMounted(true);
        if (authApi.isAuthenticated()) {
            setUser(authApi.getStoredUser());
        }

        // Listen for auth changes to update state immediately
        const handleAuthChange = () => {
            if (authApi.isAuthenticated()) {
                setUser(authApi.getStoredUser());
            } else {
                setUser(null);
            }
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
    }, []);

    const handleLogout = async () => {
        await authApi.logout();
        window.location.href = "/";
    };

    return (
        <>
            <header className="sticky top-0 z-30 w-full border-b border-white/[0.06] bg-[#0a0c0f]/80 backdrop-blur-xl">
                <nav
                    aria-label="Studio navigation"
                    className="w-full mx-auto max-w-[1148px] px-4 md:px-6 h-14 flex items-center justify-between"
                >
                    {/* Left: Brand + Nav */}
                    <div className="flex items-center gap-6">
                        {/* Brand */}
                        <Link href="/studio" className="flex items-center gap-2 select-none">
                            <Image
                                src="/logo.svg"
                                alt="ScriptHub Logo"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <span className="text-[15px] font-medium text-offgray-50 tracking-tight">
                                script<span className="text-emerald-400">hub</span>
                            </span>
                            <span className="text-[11px] font-medium text-offgray-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 ml-1">
                                Studio
                            </span>
                        </Link>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-5 bg-white/[0.08]" />

                        {/* Nav links - desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {STUDIO_NAV.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={[
                                            "text-[13px] tracking-tight rounded-md flex items-center h-8 px-3 transition-colors duration-100 select-none",
                                            isActive
                                                ? "text-offgray-50 bg-white/[0.06]"
                                                : "text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04]",
                                        ].join(" ")}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Back to main site */}
                        <Link
                            href="/home"
                            className="text-[12px] text-offgray-500 hover:text-offgray-200 transition-colors flex items-center gap-1.5"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span className="hidden sm:inline">Back to site</span>
                        </Link>

                        {/* User avatar dropdown - desktop */}
                        {isMounted && user && (
                            <div className="hidden md:block relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center overflow-hidden transition-all hover:ring-2 hover:ring-white/[0.1]">
                                        {user.avatarUrl ? (
                                            <Image
                                                src={getStorageUrl(user.avatarUrl)}
                                                alt={user.displayName}
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-offgray-300">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f1115] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50">
                                        <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                                            <p className="text-[13px] font-medium text-offgray-50 truncate">
                                                {user.displayName}
                                            </p>
                                            <p className="text-[11px] text-offgray-500 truncate">
                                                @{user.username}
                                            </p>
                                        </div>

                                        <Link
                                            href="/settings"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-offgray-200 hover:bg-white/[0.04] transition-colors"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            Settings
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.04] transition-colors"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className="md:hidden p-2 text-offgray-500 hover:text-offgray-200 transition-colors duration-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" x2="20" y1="12" y2="12" />
                                    <line x1="4" x2="20" y1="6" y2="6" />
                                    <line x1="4" x2="20" y1="18" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-14 z-40 bg-[#0a0c0f]/95 backdrop-blur-xl border-t border-white/[0.06] p-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {STUDIO_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={[
                                    "text-[13px] tracking-tight rounded-md flex items-center h-10 px-3 transition-colors duration-100 select-none",
                                    pathname === item.href
                                        ? "text-offgray-50 bg-white/[0.06]"
                                        : "text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04]",
                                ].join(" ")}
                            >
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-px bg-white/[0.06] my-3" />

                        {isMounted && user && (
                            <>
                                {/* User info */}
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center overflow-hidden">
                                        {user.avatarUrl ? (
                                            <Image
                                                src={getStorageUrl(user.avatarUrl)}
                                                alt={user.displayName}
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-offgray-300">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-medium text-offgray-50">{user.displayName}</span>
                                        <span className="text-[11px] text-offgray-500">@{user.username}</span>
                                    </div>
                                </div>

                                {/* Settings */}
                                <Link
                                    href="/settings"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-[13px] tracking-tight rounded-md flex items-center h-10 px-3 text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04] transition-colors duration-100 select-none gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Settings
                                </Link>

                                {/* Log Out */}
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="text-[13px] tracking-tight rounded-md flex items-center h-10 px-3 text-red-400 hover:bg-white/[0.04] transition-colors duration-100 select-none gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Log Out
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </>
    );
}
