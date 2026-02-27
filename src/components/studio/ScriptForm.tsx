"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GameSelector } from "./GameSelector";
import { TagInput } from "./TagInput";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { Hub } from "@/lib/api/hubs";
import { dataURLtoBlob } from "@/lib/utils/cropImage";

interface ScriptFormProps {
    initialData?: {
        title: string;
        description: string;
        loaderUrl: string;
        tags: string[];
        gamePlatformId?: string;
        hubId?: string;
        isPaid: boolean;
        purchaseUrl?: string;
        hasKeySystem: boolean;
        keySystemUrl?: string;
        useLoader?: boolean;
        thumbnailPreview?: string | null;
        gamePreview?: any;
    };
    hubs: Hub[];
    onSubmit: (data: any) => Promise<void>;
    isEditMode?: boolean;
}

export function ScriptForm({ initialData, hubs, onSubmit, isEditMode = false }: ScriptFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [loaderUrl, setLoaderUrl] = useState(initialData?.loaderUrl || "");
    const [tagsList, setTagsList] = useState<string[]>(initialData?.tags || []);
    const [gamePlatformId, setGamePlatformId] = useState(initialData?.gamePlatformId || "");
    const [selectedHubId, setSelectedHubId] = useState(initialData?.hubId || "");
    const [isPaid, setIsPaid] = useState(initialData?.isPaid || false);
    const [purchaseUrl, setPurchaseUrl] = useState(initialData?.purchaseUrl || "");
    const [hasKeySystem, setHasKeySystem] = useState(initialData?.hasKeySystem || false);
    const [keySystemUrl, setKeySystemUrl] = useState(initialData?.keySystemUrl || "");
    const [useLoader, setUseLoader] = useState(initialData?.useLoader !== false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnailPreview || null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
    const hubRef = useRef<HTMLDivElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const handleCropComplete = (croppedImage: string) => {
        setThumbnailPreview(croppedImage);

        // Convert base64 to File object for upload if needed
        fetch(croppedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
                setThumbnailFile(file);
            });

        setCropperOpen(false);
        setSelectedImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const newErrors: Record<string, string> = {};
            if (!title.trim()) newErrors.title = "Title is required";
            if (!thumbnailPreview) newErrors.thumbnail = "Thumbnail is required";
            if (!gamePlatformId) newErrors.gamePlatformId = "Please select a game";
            if (useLoader && !loaderUrl.trim()) newErrors.loaderUrl = "Loader code is required";

            if (isPaid) {
                if (!selectedHubId) newErrors.hub = "Paid scripts must be linked to a Hub";
                if (!purchaseUrl.trim()) newErrors.purchaseUrl = "Purchase URL is required";
            }
            if (hasKeySystem && !keySystemUrl.trim()) newErrors.keySystemUrl = "Key System URL is required";

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setIsLoading(false);
                return;
            }

            await onSubmit({
                title,
                description,
                loaderUrl: useLoader ? loaderUrl : undefined,
                tags: tagsList,
                gamePlatformId,
                hubId: selectedHubId,
                isPaid,
                purchaseUrl,
                hasKeySystem,
                keySystemUrl,
                useLoader,
                thumbnail: thumbnailFile,
            });
        } catch (error: any) {
            // error silently handled
            if (error.details && Array.isArray(error.details)) {
                const newErrors: Record<string, string> = {};
                error.details.forEach((err: any) => {
                    const field = err.path || err.field;
                    const msg = err.msg || err.message;
                    if (field) newErrors[field] = msg;
                });
                setErrors(newErrors);
            } else {
                setErrors({ general: error.message || "Something went wrong. Please try again." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Click outside for Hub dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
                setIsHubDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const inputCls = (field: string) =>
        `w-full h-10 px-3 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner ${errors[field]
            ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]"
            : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"
        }`;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-slide-in {
                    animation: fadeSlideIn 0.3s ease-out forwards;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .skeleton-shimmer {
                    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
            `}</style>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/studio/scripts"
                            className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 hover:text-white transition-colors mb-4 inline-flex items-center gap-2 group"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Back to Scripts
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-offgray-50">{isEditMode ? "Edit Script" : "Repository Init"}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/studio/scripts" className="hidden sm:flex h-10 px-6 rounded-md bg-[#0a0c10] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.1] text-offgray-400 hover:text-white items-center transition-all w-full sm:w-auto justify-center font-mono text-[10px] uppercase tracking-widest">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative h-10 px-6 text-white text-[10px] font-mono uppercase tracking-widest rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden bg-[#059669] hover:bg-[#10B981] shadow-lg shadow-[#10B981]/10`}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isEditMode ? "Saving..." : "Deploying..."}
                                </>
                            ) : (
                                isEditMode ? "Save Changes" : "Create Script"
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Info (2 cols wide) */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Basic Info Card */}
                        <div className="p-4 sm:p-6 bg-transparent border border-white/[0.04] rounded-xl space-y-6">
                            <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                                <span className="text-[#10B981]">01 /</span> Meta
                                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                            </h2>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Script Title <span className="text-red-500">*</span></label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls("title")} placeholder="e.g. Auto Farm Script" />
                                {errors.title && <p className="text-[10px] text-red-400 font-mono mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all resize-none shadow-inner ${errors.description ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]" : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"}`}
                                    placeholder="Describe your script capabilities..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GameSelector
                                    value={gamePlatformId}
                                    onChange={setGamePlatformId}
                                    error={errors.gamePlatformId}
                                    initialGamePreview={initialData?.gamePreview}
                                />
                                <TagInput
                                    tags={tagsList}
                                    onTagsChange={setTagsList}
                                    error={errors.tags}
                                />
                            </div>
                        </div>

                        {/* Distribution Config Card */}
                        <div className="p-4 sm:p-6 bg-transparent border border-white/[0.04] rounded-xl space-y-6">
                            <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                                <span className="text-[#10B981]">02 /</span> Distribution
                                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                            </h2>

                            {/* Hub Selector */}
                            <div className="space-y-2 pb-4 border-b border-white/[0.04]">
                                <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Collection / Hub</label>
                                <div ref={hubRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsHubDropdownOpen(!isHubDropdownOpen)}
                                        className={`w-full h-10 px-3 bg-[#0a0c10] border border-white/[0.04] rounded-lg text-sm font-mono tracking-tight flex items-center justify-between transition-all hover:border-white/[0.08] shadow-inner ${isHubDropdownOpen ? 'border-[#10B981]/40 ring-1 ring-[#10B981]/20' : ''}`}
                                    >
                                        <span className={selectedHubId ? "text-[#10B981]" : "text-offgray-600"}>
                                            {selectedHubId
                                                ? hubs.find((h) => h.id === selectedHubId)?.name
                                                : "No Hub Attached"}
                                        </span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-offgray-600 transition-transform ${isHubDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                                    </button>
                                    {isHubDropdownOpen && (
                                        <div className="absolute z-20 mt-2 w-full bg-[#11141A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto font-mono text-xs">
                                            {hubs.length > 0 ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedHubId(""); setIsPaid(false); setIsHubDropdownOpen(false); }}
                                                        className="w-full flex items-center px-4 py-3 text-offgray-500 hover:bg-[#10B981]/5 hover:text-white transition-colors text-left border-b border-white/[0.04]"
                                                    >
                                                        No Hub Attached
                                                    </button>
                                                    {hubs.map((hub) => (
                                                        <button
                                                            key={hub.id}
                                                            type="button"
                                                            onClick={() => { setSelectedHubId(hub.id); setIsHubDropdownOpen(false); }}
                                                            className={`w-full flex items-center px-4 py-3 transition-colors text-left ${selectedHubId === hub.id ? 'bg-[#10B981]/10 text-[#10B981]' : 'text-offgray-400 hover:bg-[#10B981]/5 hover:text-white'}`}
                                                        >
                                                            {hub.name}
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="px-4 py-4 text-offgray-500 text-center italic">
                                                    You don&apos;t have any Hubs yet.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.hub && <p className="text-[10px] text-red-400 font-mono mt-1">{errors.hub}</p>}
                            </div>

                            {/* Key System Toggle */}
                            <div className="space-y-3 pb-4 border-b border-white/[0.04]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-offgray-100 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
                                                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                            </svg>
                                            Key System
                                        </div>
                                        <div className="text-[10px] font-mono text-offgray-500 tracking-tight mt-1">Require key verification before execution</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasKeySystem(!hasKeySystem)}
                                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${hasKeySystem ? 'bg-[#059669]' : 'bg-[#0a0c10] border border-white/[0.08]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasKeySystem ? 'translate-x-5 shadow-sm' : 'translate-x-1 opacity-50'}`} />
                                    </button>
                                </div>
                                {hasKeySystem && (
                                    <div className="space-y-2 pt-1 animate-fade-slide-in">
                                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Key URL <span className="text-red-500">*</span></label>
                                        <input
                                            type="url"
                                            value={keySystemUrl}
                                            onChange={(e) => setKeySystemUrl(e.target.value)}
                                            className={inputCls("keySystemUrl")}
                                            placeholder="https://key.link-vert.com/..."
                                        />
                                        {errors.keySystemUrl && <p className="text-[10px] text-red-400 font-mono mt-1">{errors.keySystemUrl}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Paid Script Toggle */}
                            <div className={`space-y-3 pb-4 border-b border-white/[0.04] ${!selectedHubId ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-offgray-100 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
                                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                            Paid Script
                                        </div>
                                        <div className="text-[10px] font-mono text-offgray-500 tracking-tight mt-1">Require purchase on storefront</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPaid(!isPaid)}
                                        disabled={!selectedHubId}
                                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${isPaid ? 'bg-[#059669]' : 'bg-[#0a0c10] border border-white/[0.08]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPaid ? 'translate-x-5 shadow-sm' : 'translate-x-1 opacity-50'}`} />
                                    </button>
                                </div>
                                {!selectedHubId && (
                                    <p className="text-[10px] font-mono tracking-tight text-amber-500/80 italic bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                        * Select a Hub in the sidebar to enable monetization
                                    </p>
                                )}
                                {isPaid && (
                                    <div className="space-y-2 pt-1 animate-fade-slide-in">
                                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Purchase URL <span className="text-red-500">*</span></label>
                                        <input
                                            type="url"
                                            value={purchaseUrl}
                                            onChange={(e) => setPurchaseUrl(e.target.value)}
                                            className={inputCls("purchaseUrl")}
                                            placeholder="https://pay.store.com/..."
                                        />
                                        {errors.purchaseUrl && <p className="text-[10px] text-red-400 font-mono mt-1">{errors.purchaseUrl}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Use Loader Toggle */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-offgray-100 flex items-center gap-2">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
                                                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                            </svg>
                                            Include Loader
                                        </div>
                                        <div className="text-[10px] font-mono text-offgray-500 tracking-tight mt-1">Show public loadstring code on script page</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUseLoader(!useLoader)}
                                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${useLoader ? 'bg-[#059669]' : 'bg-[#0a0c10] border border-white/[0.08]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useLoader ? 'translate-x-5 shadow-sm' : 'translate-x-1 opacity-50'}`} />
                                    </button>
                                </div>
                                {!useLoader && (
                                    <p className="text-[10px] font-mono tracking-tight text-sky-400/80 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20 animate-fade-slide-in">
                                        Script code won't be shown publicly. Users will get the loader after completing key/purchase.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Loader Card (conditionally shown) */}
                        {useLoader && (
                            <div className="p-4 sm:p-6 bg-transparent border border-white/[0.04] rounded-xl space-y-6 animate-fade-slide-in">
                                <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                                    <span className="text-[#10B981]">03 /</span> Loader
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                                </h2>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">Payload URL <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={loaderUrl}
                                        onChange={(e) => setLoaderUrl(e.target.value)}
                                        rows={3}
                                        className={`w-full px-4 py-3 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-[#10B981] placeholder-[#10B981]/30 focus:outline-none transition-all resize-none shadow-inner ${errors.loaderUrl ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]" : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"}`}
                                        placeholder="loadstring(game:HttpGet('...'))"
                                    />
                                    {errors.loaderUrl && <p className="text-[10px] text-red-400 font-mono mt-1">{errors.loaderUrl}</p>}
                                    <p className="text-[10px] font-mono text-offgray-600 text-right mt-1">{loaderUrl.length}/2000 chars</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Meta & Monetization (1 col wide) */}
                    <div className="space-y-4">
                        {/* Thumbnail */}
                        <div className="p-4 sm:p-6 bg-transparent border border-white/[0.04] rounded-xl space-y-4">
                            <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 block pb-2 border-b border-white/[0.04]">
                                Thumbnail (16:9) <span className="text-red-500">*</span>
                            </h2>
                            <div className="relative group">
                                <div className="relative w-full aspect-video rounded-xl border border-dashed border-white/[0.08] bg-[#0a0c10] overflow-hidden transition-colors hover:border-[#10B981]/40">
                                    {thumbnailPreview ? (
                                        <Image src={thumbnailPreview} alt="Thumbnail preview" fill className="object-cover" unoptimized sizes="(max-width: 768px) 100vw, 400px" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-offgray-500">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            <span className="text-[10px] font-mono uppercase tracking-widest">Select Image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-[#0a0c10]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <label className="cursor-pointer bg-[#059669] hover:bg-[#10B981] text-white px-4 py-2 rounded-md font-mono text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-[#10B981]/10">
                                            {thumbnailPreview ? "Replace Media" : "Browse Files"}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                                {errors.thumbnail && <p className="text-[10px] text-red-400 font-mono mt-2">{errors.thumbnail}</p>}
                                <p className="mt-2 text-[10px] font-mono text-offgray-600 text-center">Max filesize: 2MB.</p>
                            </div>
                        </div>

                    </div>
                </div>

                {errors.general && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center animate-fade-slide-in">{errors.general}</div>
                )}
            </form>

            {/* Image Cropper Modal */}
            {cropperOpen && selectedImage && (
                <ImageCropper imageSrc={selectedImage} aspect={16 / 9} onCropComplete={handleCropComplete} onCancel={() => { setCropperOpen(false); setSelectedImage(null); }} />
            )}
        </div>
    );
}
