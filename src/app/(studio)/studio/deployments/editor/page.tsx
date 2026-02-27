"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { deploymentsApi } from "@/lib/api/deployments";

// Lazy-load Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_LUA_CODE = `-- ScriptHub Deployment File
-- Write your Lua code here

local Module = {}

function Module.Init()
    print("Module initialized successfully!")
end

function Module.Execute(player)
    -- Your logic here
    if player then
        print("Executing for: " .. player.Name)
    end
end

return Module
`;

export default function DeploymentsEditorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const deploymentId = searchParams.get("id");
    const nameParam = searchParams.get("name") || "Untitled";

    const [code, setCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(nameParam);
    const [isRenaming, setIsRenaming] = useState(false);
    const [loading, setLoading] = useState(!!deploymentId);
    const [currentId, setCurrentId] = useState<string | null>(deploymentId);
    const [error, setError] = useState<string | null>(null);

    // Load existing deployment content
    useEffect(() => {
        if (deploymentId) {
            const loadDeployment = async () => {
                setLoading(true);
                try {
                    const data = await deploymentsApi.getById(deploymentId);
                    setCode(data.content || "");
                    setCurrentTitle(data.title);
                    setCurrentId(data.id);
                } catch (err) {
                    // error silently handled
                    setError("Failed to load deployment");
                    setCode(DEFAULT_LUA_CODE);
                } finally {
                    setLoading(false);
                }
            };
            loadDeployment();
        } else {
            setCode(DEFAULT_LUA_CODE);
        }
    }, [deploymentId]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setError(null);
        try {
            if (currentId) {
                // Update existing
                await deploymentsApi.update(currentId, {
                    title: currentTitle,
                    content: code,
                });
            } else {
                // Create new
                const deployment = await deploymentsApi.create({
                    title: currentTitle,
                    content: code,
                });
                setCurrentId(deployment.id);
                // Update URL to include the ID for subsequent saves
                window.history.replaceState(null, "", `/studio/deployments/editor?id=${deployment.id}`);
            }
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err: any) {
            const message = err?.response?.data?.message || "Failed to save deployment";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }, [currentId, currentTitle, code]);

    const handleEditorMount = useCallback((editor: any) => {
        // Add Ctrl+S save shortcut
        editor.addCommand(2097 /* KeyMod.CtrlCmd | KeyCode.KeyS */, () => {
            handleSave();
        });
    }, [handleSave]);

    const lineCount = code.split("\n").length;
    const charCount = code.length;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in duration-500">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0c10] border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href="/studio/deployments"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Back to Deployments"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                    </Link>

                    <div className="w-px h-5 bg-white/[0.06]" />

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>

                        {isRenaming ? (
                            <input
                                autoFocus
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                onBlur={() => setIsRenaming(false)}
                                onKeyDown={(e) => { if (e.key === "Enter") setIsRenaming(false); }}
                                className="h-7 px-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm font-mono text-white outline-none focus:border-emerald-500/40 w-48"
                            />
                        ) : (
                            <button
                                onClick={() => setIsRenaming(true)}
                                className="text-sm font-mono text-offgray-200 hover:text-white transition-colors"
                                title="Click to rename"
                            >
                                {currentTitle}
                            </button>
                        )}

                        <span className="text-[9px] font-mono text-offgray-600 bg-white/[0.04] rounded px-1.5 py-0.5 uppercase tracking-widest">Lua</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {error && (
                        <span className="text-[11px] font-mono text-rose-400 animate-in fade-in duration-300 max-w-[200px] truncate" title={error}>
                            {error}
                        </span>
                    )}

                    {isSaved && (
                        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 animate-in fade-in duration-300">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Saved
                        </span>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving || loading}
                        className="h-8 px-4 rounded-lg bg-[#059669] hover:bg-[#10B981] text-[11px] font-bold text-white transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                            </svg>
                        )}
                        {isSaving ? "Saving..." : "Save & Deploy"}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-[#1e1e1e]">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-offgray-500 font-mono text-sm animate-pulse">
                        Loading deployment...
                    </div>
                ) : (
                    <Editor
                        defaultLanguage="lua"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        onMount={handleEditorMount}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
                            fontLigatures: true,
                            minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
                            lineNumbers: "on",
                            renderLineHighlight: "all",
                            scrollBeyondLastLine: false,
                            wordWrap: "off",
                            tabSize: 4,
                            insertSpaces: true,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 },
                            scrollbar: {
                                verticalScrollbarSize: 8,
                                horizontalScrollbarSize: 8,
                            },
                            suggest: { showKeywords: true },
                            bracketPairColorization: { enabled: true },
                            guides: {
                                bracketPairs: true,
                                indentation: true,
                            },
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            smoothScrolling: true,
                        }}
                    />
                )}
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0c10] border-t border-white/[0.06] shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-offgray-600">Lua</span>
                    <span className="text-[10px] font-mono text-offgray-600">UTF-8</span>
                    <span className="text-[10px] font-mono text-offgray-600">LF</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-offgray-600">{lineCount} lines</span>
                    <span className="text-[10px] font-mono text-offgray-600">{charCount} chars</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-offgray-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentId ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {currentId ? "Deployed" : "New"}
                    </span>
                </div>
            </div>
        </div>
    );
}
