"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // error silently handled
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-surface-panel border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-red-500/10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
            </div>

            {/* Text */}
            <div className="space-y-3 max-w-md">
                <h2 className="heading-base text-2xl">Something went wrong</h2>
                <p className="text-offgray-400 text-sm leading-relaxed">
                    An unexpected error occurred. Please try again or return to the home page.
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-black transition-colors duration-200 min-w-[140px]"
                >
                    Try Again
                </button>
                <a
                    href="/home"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-surface-panel hover:bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-offgray-200 transition-colors duration-200 min-w-[140px]"
                >
                    Return Home
                </a>
            </div>
        </div>
    );
}
