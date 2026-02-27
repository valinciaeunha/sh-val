"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { tagsApi, Tag } from "@/lib/api/tags";

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    error?: string;
}

export function TagInput({ tags: tagsList, onTagsChange, error }: TagInputProps) {
    const [tagInput, setTagInput] = useState("");
    const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [tagSearchLoading, setTagSearchLoading] = useState(false);
    const tagRef = useRef<HTMLDivElement>(null);
    const tagSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Tag Search Logic ---
    const handleTagSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setTagSuggestions([]);
            return;
        }
        setTagSearchLoading(true);
        try {
            const results = await tagsApi.searchTags(query.trim());
            // Filter out tags already in tagsList
            setTagSuggestions(results.filter(t => !tagsList.includes(t.name)));
        } catch {
            setTagSuggestions([]);
        } finally {
            setTagSearchLoading(false);
        }
    }, [tagsList]);

    const onTagInputChange = (value: string) => {
        // Handle auto-splitting by comma
        if (value.includes(",")) {
            const parts = value.split(",");
            const lastPart = parts.pop() || "";

            const tagsToAdd = parts
                .map(p => p.trim().toLowerCase())
                .filter(p => p && !tagsList.includes(p));

            if (tagsToAdd.length > 0) {
                onTagsChange([...tagsList, ...tagsToAdd]);
            }

            setTagInput(lastPart);
            value = lastPart;
        } else {
            setTagInput(value);
        }

        setShowTagSuggestions(true);
        if (tagSearchTimerRef.current) clearTimeout(tagSearchTimerRef.current);

        const searchValue = value.trim();
        if (searchValue) {
            tagSearchTimerRef.current = setTimeout(() => handleTagSearch(searchValue), 300);
        } else {
            setTagSuggestions([]);
        }
    };

    const addTag = (tag: string) => {
        const cleanTag = tag.trim().replace(/,$/g, '').toLowerCase();
        if (cleanTag && !tagsList.includes(cleanTag)) {
            onTagsChange([...tagsList, cleanTag]);
        }
        setTagInput("");
        setTagSuggestions([]);
        setShowTagSuggestions(false);
    };

    // Click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
                setShowTagSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (tagSearchTimerRef.current) clearTimeout(tagSearchTimerRef.current);
        };
    }, []);

    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-wider">Tags</label>
            <div ref={tagRef} className="relative">
                <div className={`flex items-center flex-wrap gap-2 min-h-[38px] px-3 py-1.5 bg-white/[0.02] border rounded-lg transition-all ${error ? 'border-red-500/50' : 'border-white/[0.06] focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20'}`}>
                    {tagsList.map((tag, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.08] border border-white/[0.1] text-[12px] text-offgray-200 select-none animate-fade-slide-in"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => onTagsChange(tagsList.filter((_, idx) => idx !== i))}
                                className="text-offgray-500 hover:text-red-400 transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" x2="6" y1="6" y2="18" />
                                    <line x1="6" x2="18" y1="6" y2="18" />
                                </svg>
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => onTagInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && tagInput.trim()) {
                                e.preventDefault();
                                addTag(tagInput);
                            }
                            if (e.key === 'Backspace' && !tagInput && tagsList.length > 0) {
                                onTagsChange(tagsList.slice(0, -1));
                            }
                        }}
                        onFocus={() => {
                            if (tagInput.trim()) setShowTagSuggestions(true);
                        }}
                        className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-offgray-600 focus:outline-none py-0.5"
                        placeholder={tagsList.length === 0 ? 'Type tag & press space...' : 'Add more...'}
                    />
                </div>

                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && (tagInput.trim() || tagSuggestions.length > 0) && (
                    <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/[0.06] bg-surface-panel shadow-2xl overflow-hidden animate-fade-slide-in">
                        {tagSearchLoading ? (
                            <div className="p-3 flex items-center gap-2 text-xs text-offgray-500">
                                <div className="w-3 h-3 border border-white/20 border-t-emerald-500 rounded-full animate-spin" />
                                Searching labels...
                            </div>
                        ) : tagSuggestions.length > 0 ? (
                            <div className="p-1 max-h-48 overflow-y-auto">
                                {tagSuggestions.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => addTag(tag.name)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left group"
                                    >
                                        <span className="text-xs text-offgray-200 group-hover:text-white transition-colors">#{tag.name}</span>
                                        <span className="text-[10px] text-offgray-600 uppercase tracking-wider group-hover:text-emerald-500/70 transition-colors">Existing Tag</span>
                                    </button>
                                ))}
                            </div>
                        ) : tagInput.trim() ? (
                            <div className="p-1">
                                <button
                                    type="button"
                                    onClick={() => addTag(tagInput)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-left group"
                                >
                                    <span className="text-xs text-offgray-200 group-hover:text-white">Create &ldquo;{tagInput.trim()}&rdquo;</span>
                                    <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider">New Tag</span>
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
        </div>
    );
}
