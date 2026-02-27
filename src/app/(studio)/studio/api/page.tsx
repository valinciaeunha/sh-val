"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, RefreshCw, Key, ShieldAlert } from "lucide-react";
import { usersApi } from "@/lib/api/users";


export default function DeveloperApiPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        fetchApiKey();
    }, []);

    const fetchApiKey = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getApiKey();
            setApiKey(data.api_key);
        } catch (err: any) {
            // error silently handled
            setError(err.response?.data?.message || "Failed to load API key");
        } finally {
            setLoading(false);
        }
    };

    const confirmGeneration = () => {
        if (apiKey) {
            setShowConfirm(true);
        } else {
            handleGenerateKey();
        }
    };

    const handleGenerateKey = async () => {
        setShowConfirm(false);
        try {
            setGenerating(true);
            setError(null);
            const data = await usersApi.generateApiKey();
            setApiKey(data.api_key);
        } catch (err: any) {
            // error silently handled
            setError(err.response?.data?.message || "Failed to generate API key");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl">
                {/* Header */}
                <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                            Developer API
                        </h1>
                        <p className="text-sm font-mono text-offgray-500 max-w-lg">
                            Manage your API key for programmatic access to ScriptHub services, endpoints, and integrations.
                        </p>
                    </div>
                </section>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-red-400 leading-relaxed">{error}</p>
                    </div>
                )}

                {/* Main Settings Card */}
                <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />

                    <div className="px-5 py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                            <Key size={16} className="text-offgray-500" />
                            <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">Developer Credentials</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.03]">
                        {/* API Key Row */}
                        <div className="px-5 py-4 hover:bg-white/[0.015] transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 md:max-w-xs xl:max-w-sm">
                                    <p className="text-[13px] font-medium text-offgray-200">Global API Key</p>
                                    <p className="text-[11px] font-mono leading-relaxed text-offgray-500">
                                        Use this key to authorize automated requests. Keep it secure and never share it publicly.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <div className="flex-1 md:w-[280px] h-9 px-3 bg-[#12151a] border border-white/[0.06] rounded-lg flex items-center overflow-hidden">
                                        {loading ? (
                                            <span className="text-[12px] font-mono text-offgray-600 italic">Loading configuration...</span>
                                        ) : apiKey ? (
                                            <code className="text-[12px] font-mono text-emerald-400 truncate select-all">{apiKey}</code>
                                        ) : (
                                            <span className="text-[12px] font-mono text-offgray-600 italic">No API key generated</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        disabled={!apiKey || loading}
                                        className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-offgray-300 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed group relative"
                                        title="Copy API Key"
                                    >
                                        {copied ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>

                                    <button
                                        onClick={confirmGeneration}
                                        disabled={loading || generating}
                                        className="h-9 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-[12px] font-mono font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
                                        {generating ? "Working" : apiKey ? "Regenerate" : "Generate"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* API Documentation Link */}
                        <div className="px-5 py-4 hover:bg-white/[0.015] transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 max-w-lg">
                                    <p className="text-[13px] font-medium text-blue-400">REST API Documentation</p>
                                    <p className="text-[11px] font-mono leading-relaxed text-blue-300/60">
                                        Learn how to use your API key to automate tasks, validate licenses, and manage your deployments programmatically.
                                    </p>
                                </div>
                                <Link
                                    href="/api-docs"
                                    className="h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-bold tracking-wide transition-colors shrink-0 mt-2 md:mt-0"
                                >
                                    View Docs
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Custom Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Regenerate API Key?</h3>
                                    <p className="text-xs text-red-400 mt-0.5">This is a destructive action</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-[13px] text-offgray-300 leading-relaxed mb-4">
                                Generating a new API key will <span className="font-semibold text-white">immediately invalidate your current key</span>. Any integrations, scripts, or automations using the old key will instantly break and require updating.
                            </p>
                            <p className="text-[13px] text-offgray-400 mb-6">
                                Are you absolutely sure you want to proceed?
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 rounded-xl text-[13px] font-medium text-offgray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateKey}
                                    className="px-4 py-2 rounded-xl text-[13px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                    Yes, Regenerate Key
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
