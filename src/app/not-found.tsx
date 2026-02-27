"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-8 relative overflow-hidden bg-surface-root text-offgray-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex justify-center items-center">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" className="text-offgray-500" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center space-y-6 max-w-lg mx-auto px-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-surface-panel border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" x2="12" y1="9" y2="13" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                    </svg>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="heading-base text-4xl md:text-5xl tracking-tight">Page not found</h1>
                    <p className="text-offgray-400 text-sm md:text-base leading-relaxed">
                        The page you are looking for doesn&apos;t exist or has been moved. Check the URL or return to the home page.
                    </p>
                </div>

                {/* Action */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Link
                        href="/home"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-black transition-colors duration-200 min-w-[140px]"
                    >
                        Return Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-surface-panel hover:bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-offgray-200 transition-colors duration-200 min-w-[140px]"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
