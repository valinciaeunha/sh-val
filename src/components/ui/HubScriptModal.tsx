"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Hub, hubsApi } from "@/lib/api/hubs";
import { scriptsApi, Script } from "@/lib/api/scripts";

interface HubScriptModalProps {
    hub: Hub;
    onClose: () => void;
}

export function HubScriptModal({ hub, onClose }: HubScriptModalProps) {
    const [hubScripts, setHubScripts] = useState<any[]>([]);
    const [myScripts, setMyScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<Script | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch hub scripts and user's scripts
    const fetchData = useCallback(async () => {
        try {
            const [hubScriptsData, allMyScripts] = await Promise.all([
                hubsApi.getHubScripts(hub.id),
                scriptsApi.getMyScripts(),
            ]);
            setHubScripts(hubScriptsData);
            setMyScripts(allMyScripts);
        } catch (error) {
            // error silently handled
        } finally {
            setIsLoading(false);
        }
    }, [hub.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scripts available = user's scripts NOT already in this hub
    const hubScriptIds = new Set(hubScripts.map((s: any) => s.id));
    const availableScripts = myScripts.filter((s) => !hubScriptIds.has(s.id));

    const handleAdd = async () => {
        if (!selectedOption) return;
        setIsAdding(true);
        try {
            await hubsApi.addScriptToHub(hub.id, selectedOption.id);
            // Move script from available to hub list
            setHubScripts((prev) => [...prev, { ...selectedOption, hub_id: hub.id }]);
            setSelectedOption(null);
            setIsDropdownOpen(false);
        } catch (error) {
            // error silently handled
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (scriptId: string) => {
        setRemovingId(scriptId);
        try {
            await hubsApi.removeScriptFromHub(hub.id, scriptId);
            setHubScripts((prev) => prev.filter((s: any) => s.id !== scriptId));
        } catch (error) {
            // error silently handled
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md border border-white/[0.06] bg-[#0f1115] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-offgray-50">Manage Scripts</h3>
                        <p className="text-xs text-offgray-500 mt-0.5">{hub.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Add Script */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-wider">Add Script</label>
                                <div className="flex gap-2">
                                    {/* Custom Dropdown */}
                                    <div className="relative flex-1" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className={`w-full flex items-center justify-between h-9 px-3 rounded-lg text-sm transition-all border ${isDropdownOpen
                                                ? 'border-emerald-500/40 bg-white/[0.04]'
                                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
                                                }`}
                                        >
                                            <span className={selectedOption ? 'text-offgray-200' : 'text-offgray-500 text-xs'}>
                                                {selectedOption ? selectedOption.title : 'Select a script...'}
                                            </span>
                                            <svg
                                                className={`w-3.5 h-3.5 text-offgray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#13161a] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-1 duration-150">
                                                <div className="max-h-48 overflow-y-auto p-1">
                                                    {availableScripts.length > 0 ? (
                                                        availableScripts.map((script) => (
                                                            <button
                                                                key={script.id}
                                                                onClick={() => {
                                                                    setSelectedOption(script);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/[0.06] transition-colors group text-left"
                                                            >
                                                                <span className="text-sm text-offgray-200 group-hover:text-white transition-colors truncate">
                                                                    {script.title}
                                                                </span>
                                                                {script.gameName && (
                                                                    <span className="text-[10px] text-offgray-600 font-medium shrink-0 ml-2">
                                                                        {script.gameName}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-center text-offgray-500 text-xs">
                                                            {myScripts.length === 0 ? 'No scripts created yet' : 'All scripts already in this hub'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAdd}
                                        className="h-9 px-4 bg-white text-black text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        disabled={!selectedOption || isAdding}
                                    >
                                        {isAdding ? (
                                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            'Add'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Current Scripts List */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-wider">
                                    Hub Scripts ({hubScripts.length})
                                </label>
                                <div className="max-h-[280px] overflow-y-auto space-y-1.5">
                                    {hubScripts.length > 0 ? (
                                        hubScripts.map((script: any) => (
                                            <div key={script.id} className={`group flex items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all ${removingId === script.id ? 'opacity-50' : ''}`}>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-offgray-100 truncate">{script.title}</p>
                                                    <p className="text-[10px] text-offgray-600">{script.game_name || script.gameName || 'No game'}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(script.id)}
                                                    disabled={removingId === script.id}
                                                    className="w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-offgray-600 hover:text-red-400 transition-all disabled:opacity-50"
                                                    title="Remove from hub"
                                                >
                                                    {removingId === script.id ? (
                                                        <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/[0.06] rounded-xl text-center">
                                            <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-offgray-600 mb-2.5">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-offgray-500">No scripts in this hub yet.</p>
                                            <p className="text-[10px] text-offgray-600 mt-0.5">Select a script above to add it.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-white/[0.06] flex justify-end">
                    <button
                        onClick={onClose}
                        className="h-9 px-5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium text-offgray-200 hover:text-white transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
