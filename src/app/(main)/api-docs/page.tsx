"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyIcon, Box, Terminal, Server } from "lucide-react";

export default function ApiDocsPage() {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("keys");

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: "keys", label: "License Keys API", icon: KeyIcon, isReady: true },
        { id: "hubs", label: "Hub Management", icon: Box, isReady: false },
        { id: "scripts", label: "Script Obfuscation", icon: Terminal, isReady: false },
        { id: "webhooks", label: "Webhooks", icon: Server, isReady: false }
    ];

    return (
        <div className="min-h-screen bg-[#07090c] flex justify-center w-full">
            <div className="flex w-full max-w-[1400px]">
                {/* Left Sidebar (Sticky Navigation) */}
                <aside className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/[0.04] pt-20 pb-8 px-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-offgray-100 mb-3 px-2 tracking-wide uppercase">Core API</h3>
                            <nav className="space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => tab.isReady && setActiveTab(tab.id)}
                                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-sm ${activeTab === tab.id
                                                ? "bg-white/[0.06] text-white font-medium"
                                                : "text-offgray-400 hover:bg-white/[0.03] hover:text-offgray-200"
                                                } ${!tab.isReady ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon size={16} className={activeTab === tab.id ? "text-emerald-400" : "text-offgray-500"} />
                                                <span>{tab.label}</span>
                                            </div>
                                            {!tab.isReady && (
                                                <span className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded font-medium text-offgray-500">
                                                    Soon
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-offgray-100 mb-3 px-2 tracking-wide uppercase">Resources</h3>
                            <nav className="space-y-1">
                                <Link href="/studio/api" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-offgray-400 hover:bg-white/[0.03] hover:text-offgray-200 transition-colors">
                                    <KeyIcon size={16} className="text-offgray-500" />
                                    <span>Manage API Key</span>
                                </Link>
                                <Link href="/studio" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-offgray-400 hover:bg-white/[0.03] hover:text-offgray-200 transition-colors">
                                    <Box size={16} className="text-offgray-500" />
                                    <span>Back to Studio</span>
                                </Link>
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 pt-20 pb-24 px-6 md:px-12 lg:px-16 xl:px-24">
                    <div className="max-w-[800px]">
                        {/* Header */}
                        <div className="mb-12 border-b border-white/[0.04] pb-8">
                            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
                                ScriptHub API Documentation
                            </h1>
                            <p className="text-base text-offgray-400 leading-relaxed max-w-2xl">
                                Welcome to the ScriptHub developer documentation. Here you'll find everything you need to know about integrating ScriptHub directly into your discord bots, websites, and backend systems.
                            </p>
                        </div>

                        {activeTab === "keys" && (
                            <div className="space-y-16 animate-in fade-in duration-500">
                                {/* Generates Keys Endpoint */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400">POST</span>
                                        <h2 className="text-xl font-semibold text-white">Generate License Keys</h2>
                                    </div>
                                    <p className="text-sm text-offgray-400 leading-relaxed max-w-3xl mb-8">
                                        Automatically generate license keys for your users. Note that this endpoint is strictly protected by your API Key and respects your plan's maximum key quota limits. You can generate multiple keys per request.
                                    </p>

                                    <div className="space-y-10">
                                        {/* Endpoint URL */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Endpoint</h3>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <code className="text-[13px] font-mono text-offgray-300 break-all select-all">
                                                    https://api.scripthub.id/api/v2/keys/generate
                                                </code>
                                                <button
                                                    onClick={() => handleCopy("https://api.scripthub.id/api/v2/keys/generate")}
                                                    className="ml-4 p-1.5 rounded-md hover:bg-white/[0.06] transition-colors shrink-0 text-offgray-500 hover:text-white"
                                                    title="Copy endpoint URL"
                                                >
                                                    {copied ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Headers */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Headers</h3>
                                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 text-[13px] font-mono">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-3">
                                                    <div className="text-offgray-400 w-32 shrink-0">Authorization</div>
                                                    <div className="text-offgray-200">
                                                        Bearer <span className="text-offgray-500 italic">&lt;Your_API_Key&gt;</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                                    <div className="text-offgray-400 w-32 shrink-0">Content-Type</div>
                                                    <div className="text-offgray-200">application/json</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Request Body */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Request Body</h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-offgray-300">
                                                {`{
  // Required string: The exact ID of the target script
  "scriptId": "uuid-string-of-script",
  
  // Required enum: "lifetime", "timed", or "device_locked"
  "type": "lifetime",
  
  // Optional number: How many devices can attach to this key (1-10) Default: 1
  "maxDevices": 1,
  
  // Optional number: Required ONLY if type is "timed" (1-365)
  "expiresInDays": 30,
  
  // Optional number: Keys to generate per request (max 10,000) Default: 1
  "quantity": 1,
  
  // Optional string: Custom note/identifier
  "note": "Purchased by DiscordID: 123456789"
}`}
                                            </pre>
                                        </div>

                                        {/* Response Payload */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Success Response <span className="text-offgray-500 font-normal ml-2">201 Created</span></h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-400/90">
                                                {`{
  "success": true,
  "message": "1 key(s) generated successfully",
  "data": [
    {
      "id": "uuid-string",
      "key_value": "SH-id581889ce6357438e82daf430c5c",
      "type": "lifetime",
      "status": "unused",
      "max_devices": 1,
      // ...other details
    }
  ]
}`}
                                            </pre>
                                        </div>

                                        {/* Error Example */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Error Response <span className="text-offgray-500 font-normal ml-2">403 Forbidden</span></h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-red-400/90">
                                                {`{
  "error": "QuotaExceeded",
  "message": "Limit reached. You currently have 95 valid keys out of your 100 maximum limit. Cannot generate 10 more."
}`}
                                            </pre>
                                        </div>

                                    </div>
                                </div>

                                {/* Validate Key Endpoint */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-400">POST</span>
                                        <h2 className="text-xl font-semibold text-white">Validate License Key</h2>
                                    </div>
                                    <p className="text-sm text-offgray-400 leading-relaxed max-w-3xl mb-8">
                                        Validate a license key from your Roblox executor or any client. This endpoint checks the key status, expiry, and optionally binds the client&apos;s hardware ID (HWID) for device locking. If the key is valid and unused, it will automatically be activated.
                                    </p>

                                    <div className="space-y-10">
                                        {/* Endpoint URL */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Endpoint</h3>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <code className="text-[13px] font-mono text-offgray-300 break-all select-all">
                                                    https://api.scripthub.id/api/v2/keys/validate
                                                </code>
                                                <button
                                                    onClick={() => handleCopy("https://api.scripthub.id/api/v2/keys/validate")}
                                                    className="ml-4 p-1.5 rounded-md hover:bg-white/[0.06] transition-colors shrink-0 text-offgray-500 hover:text-white"
                                                    title="Copy endpoint URL"
                                                >
                                                    {copied ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Headers */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Headers</h3>
                                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 text-[13px] font-mono">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                                    <div className="text-offgray-400 w-32 shrink-0">Content-Type</div>
                                                    <div className="text-offgray-200">application/json</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Request Body */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Request Body</h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-offgray-300">
                                                {`{
  // Required string: The license key value to validate
  "key": "SH-id581889ce6357438e82daf430c5c",
  
  // Optional string: Script UUID to verify the key belongs to this script
  "scriptId": "uuid-string-of-script",
  
  // Optional string: Hardware ID for device locking (max 128 chars)
  // If provided, the device will be auto-registered to the key
  "hwid": "unique-device-hardware-id"
}`}
                                            </pre>
                                        </div>

                                        {/* Success Response */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Success Response <span className="text-offgray-500 font-normal ml-2">200 OK</span></h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-400/90">
                                                {`{
  "success": true,
  "valid": true,
  "message": "Key is valid.",
  "data": {
    "id": "uuid-string",
    "type": "lifetime",
    "status": "active",
    "max_devices": 3,
    "expires_at": null,
    "script_title": "My Cool Script"
  }
}`}
                                            </pre>
                                        </div>

                                        {/* Error Responses */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Error Responses <span className="text-offgray-500 font-normal ml-2">403 Forbidden</span></h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-red-400/90">
                                                {`// Invalid or revoked key
{
  "success": false,
  "valid": false,
  "message": "Invalid key. Key does not exist."
}

// Device limit reached
{
  "success": false,
  "valid": false,
  "message": "Device limit reached (3). This key is already bound to 3 device(s)."
}

// Expired key
{
  "success": false,
  "valid": false,
  "message": "Key has expired."
}`}
                                            </pre>
                                        </div>

                                        {/* Lua Example */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-offgray-200">Lua Example <span className="text-offgray-500 font-normal ml-2">Roblox Executor</span></h3>
                                            <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-x-auto text-[13px] font-mono leading-relaxed text-offgray-300">
                                                {`local HttpService = game:GetService("HttpService")

local response = request({
    Url = "https://api.scripthub.id/api/v2/keys/validate",
    Method = "POST",
    Headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer YOUR_API_KEY"
    },
    Body = HttpService:JSONEncode({
        key = "SH-id581889ce6357438e82daf430c5c",
        hwid = gethwid()  -- executor HWID function
    })
})

local data = HttpService:JSONDecode(response.Body)
if data.valid then
    print("✅ Key valid! Script:", data.data.script_title)
    -- Load your script here
else
    print("❌ Invalid:", data.message)
end`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
