"use client";

import Link from "next/link";

export default function StudioObfuscatePage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Obfuscations</h1>
                    <p className="text-sm font-mono text-offgray-500">Secure and obfuscate your Lua payloads.</p>
                </div>
            </section>

            {/* Coming Soon State */}
            <div className="flex flex-col items-center justify-center py-24 px-4 h-[50vh] border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" style={{ backgroundSize: '20px 20px' }} />

                {/* Animated Gear Icon */}
                <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#059669]/20 blur-2xl rounded-full group-hover:bg-[#10B981]/30 transition-colors duration-700" />
                    <div className="w-16 h-16 rounded-2xl bg-[#11141A] border border-white/[0.06] shadow-2xl flex items-center justify-center relative z-10 group-hover:border-[#10B981]/30 transition-all duration-500 transform group-hover:scale-105">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500 group-hover:text-[#10B981] transition-colors duration-500 animate-[spin_4s_linear_infinite]">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                </div>

                <div className="text-center space-y-3 max-w-md relative z-10">
                    <h2 className="text-2xl font-serif tracking-tight text-white drop-shadow-sm">
                        Coming Soon
                    </h2>
                    <p className="text-[15px] font-mono text-offgray-400 leading-relaxed px-4">
                        We're currently building our advanced obfuscation engine. This feature will allow you to secure your scripts with enterprise-grade protection before deployment.
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-[#10B981]/40 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }} />
                <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" />
            </div>
        </div>
    );
}
