"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
// import { AuthModal } from "@/components/auth/AuthModal"; // Removed, handled by context
import { authApi, User } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getStorageUrl } from "@/lib/utils/image";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "Hubs", href: "/hubs" },
  { label: "Roblox Games", href: "/games" },
  { label: "Trending", href: "/trending" },
  { label: "Rules", href: "/rules" },
  { label: "Executors", href: "/executors" },
  { label: "API Docs", href: "/api-docs" },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Removed
  // const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login"); // Removed
  const { openAuthModal } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (authApi.isAuthenticated()) {
      setUser(authApi.getStoredUser());
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      if (authApi.isAuthenticated()) {
        setUser(authApi.getStoredUser());
      } else {
        setUser(null);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // const openAuthModal = (tab: "login" | "register") => { // Removed local function
  //   setAuthModalTab(tab);
  //   setIsAuthModalOpen(true);
  // };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    window.dispatchEvent(new Event('auth-change')); // Notify other components
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-white/[0.06] bg-[#0a0c0f]/80 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="w-full mx-auto max-w-[1148px] px-4 md:px-6 h-14 flex items-center justify-between"
        >
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/home" className="flex items-center gap-2 select-none">
              {/* Logo */}
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
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
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
              {/* Studio Menu - Only visible when logged in */}
              {isMounted && user && (
                <Link
                  href="/studio"
                  className={[
                    "group flex items-center gap-2 h-8 px-3 rounded-md border text-[13px] tracking-tight font-medium transition-all duration-200 select-none",
                    pathname.startsWith("/studio")
                      ? "bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-white/[0.02] border-white/[0.04] text-offgray-400 hover:bg-[#10B981]/5 hover:border-[#10B981]/20 hover:text-[#10B981]",
                  ].join(" ")}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981] opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span>Studio</span>
                </Link>
              )}
              {/* Admin Panel — only for admin role users */}
              {isMounted && user?.roles?.includes('admin') && (
                <Link
                  href="/admin"
                  className={[
                    "flex items-center gap-1.5 h-8 px-3 rounded-md border text-[13px] tracking-tight font-medium transition-all duration-200 select-none",
                    pathname.startsWith("/admin")
                      ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                      : "bg-rose-500/5 border-rose-500/10 text-rose-500 hover:bg-rose-500/15 hover:border-rose-500/25 hover:text-rose-300",
                  ].join(" ")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isMounted && user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
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

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f1115] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
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
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="hidden md:flex text-[13px] tracking-tight font-medium text-black bg-emerald-500 hover:bg-emerald-400 transition-colors duration-100 h-8 items-center px-4 rounded-md"
              >
                Sign In
              </button>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-offgray-500 hover:text-offgray-200 transition-colors duration-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
            {NAV_ITEMS.map((item) => (
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
            {/* Mobile Studio Link */}
            {isMounted && user && (
              <Link
                href="/studio"
                onClick={() => setIsMobileMenuOpen(false)}
                className={[
                  "text-[13px] tracking-tight rounded-md flex items-center gap-2 h-10 px-3 font-medium transition-colors duration-100 select-none",
                  pathname.startsWith("/studio")
                    ? "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20"
                    : "text-offgray-400 bg-white/[0.02] border border-white/[0.04] hover:text-[#10B981] hover:bg-[#10B981]/5 hover:border-[#10B981]/20",
                ].join(" ")}
              >
                <Sparkles className="w-4 h-4" />
                <span>Studio</span>
              </Link>
            )}
            {/* Admin Panel mobile — only for admin role */}
            {isMounted && user?.roles?.includes('admin') && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={[
                  "text-[13px] tracking-tight rounded-md flex items-center gap-2 h-10 px-3 font-medium transition-colors duration-100 select-none border",
                  pathname.startsWith("/admin")
                    ? "text-rose-300 bg-rose-500/15 border-rose-500/25"
                    : "text-rose-500 bg-rose-500/5 border-rose-500/10 hover:text-rose-300 hover:bg-rose-500/15",
                ].join(" ")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Admin Panel</span>
              </Link>
            )}

            <div className="h-px bg-white/[0.06] my-3" />

            {isMounted && user ? (
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
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal("login");
                }}
                className="text-[13px] tracking-tight font-medium text-black bg-emerald-500 hover:bg-emerald-400 h-10 flex items-center justify-center px-3 rounded-md transition-colors duration-100 w-full"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal Removed - Handled by Context */}
    </>
  );
}
