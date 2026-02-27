"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getExecutorBySlug, updateExecutor, UpdateExecutorData, Executor } from "@/lib/api/executors";
import { getStorageUrl } from "@/lib/utils/image";
import Image from "next/image";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { dataURLtoBlob } from "@/lib/utils/cropImage";
import { authApi } from "@/lib/api/auth";

export default function EditExecutorPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [executor, setExecutor] = useState<Executor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setUser(authApi.getStoredUser());
    }, []);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [price, setPrice] = useState("Free");
    const [status, setStatus] = useState("Working");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Socials
    const [discord, setDiscord] = useState("");
    const [telegram, setTelegram] = useState("");

    // Image State
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeCropType, setActiveCropType] = useState<'logo' | 'banner'>('logo');

    useEffect(() => {
        const fetchExecutor = async () => {
            try {
                const data = await getExecutorBySlug(slug);
                setExecutor(data);

                // Populate Form
                setName(data.name || "");
                setDescription(data.description || "");
                setWebsite(data.website || "");
                setDiscord(data.discord || "");
                setTelegram(data.telegram || "");
                setPlatforms(data.platforms || []);
                setPrice(data.priceModel || "Free");
                setStatus(data.status || "Working");
                setTags(data.tags || []);

                if (data.logoUrl) setLogoPreview(getStorageUrl(data.logoUrl));
                if (data.bannerUrl) setBannerPreview(getStorageUrl(data.bannerUrl));

            } catch (error) {
                // error silently handled
                router.push("/studio/executors");
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchExecutor();
        }
    }, [slug, router]);

    const isDiscordUser = user?.avatarUrl?.includes('discord') || false;

    if (user && !isDiscordUser) {
        return (
            <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-[#11141A] border border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-serif tracking-tight text-white">
                        Access Restricted
                    </h2>
                    <p className="text-sm font-mono text-offgray-400 leading-relaxed max-w-[90%] mx-auto">
                        To maintain a high-quality ecosystem and thoroughly review new Executors, maintaining a verified <span className="text-[#5865F2] font-semibold border-b border-[#5865F2]/40 pb-0.5">Discord connection</span> is mandatory. <br />
                        <br />
                        Please log out and sign in using Discord OAuth to manage your Executor.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/studio/executors"
                        className="h-10 px-6 rounded-md bg-[#0a0c10] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.1] text-offgray-400 hover:text-white flex items-center transition-all w-full sm:w-auto justify-center font-mono text-xs uppercase tracking-widest"
                    >
                        Back to List
                    </Link>
                </div>
            </div>
        );
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setActiveCropType(type);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropComplete = (croppedImage: string) => {
        if (activeCropType === 'logo') {
            setLogoPreview(croppedImage);
        } else {
            setBannerPreview(croppedImage);
        }
        setCropperOpen(false);
        setSelectedImage(null);
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        setSelectedImage(null);
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !tags.includes(newTag) && tags.length < 3) {
                setTags([...tags, newTag]);
                setTagInput("");
            }
        }
    };

    const togglePlatform = (p: string) => {
        if (platforms.includes(p)) {
            if (platforms.length > 1) {
                setPlatforms(platforms.filter(plat => plat !== p));
            }
        } else {
            setPlatforms([...platforms, p]);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!executor) return;

        if (platforms.length === 0) {
            alert("Please select at least one platform.");
            return;
        }

        setIsSaving(true);
        setErrors({});

        try {
            const updateData: UpdateExecutorData = {
                name,
                description,
                website,
                discord,
                telegram,
                platforms,
                priceModel: price,
                tags,
                status,
            };

            // Only append new blobs if preview changed from original URL
            if (logoPreview && (!executor.logoUrl || logoPreview !== getStorageUrl(executor.logoUrl))) {
                const blob = dataURLtoBlob(logoPreview);
                updateData.logo = new File([blob], "logo.png", { type: "image/png" });
            }
            if (bannerPreview && (!executor.bannerUrl || bannerPreview !== getStorageUrl(executor.bannerUrl))) {
                const blob = dataURLtoBlob(bannerPreview);
                updateData.banner = new File([blob], "banner.png", { type: "image/png" });
            }

            await updateExecutor(executor.id.toString(), updateData);

            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);

            // Fetch to refresh data visually (in case name/slug syncs)
            const updated = await getExecutorBySlug(slug);
            setExecutor(updated);

        } catch (error: any) {
            // error silently handled

            if (error?.error === "ValidationError" && Array.isArray(error?.details)) {
                // ... validation errors
                const newErrors: Record<string, string> = {};
                error.details.forEach((err: any) => {
                    const field = err.path || err.field;
                    const msg = err.msg || err.message;
                    if (field) {
                        newErrors[field] = msg;
                    }
                });
                setErrors(newErrors);
            } else if (error?.error === "ValidationError") {
                alert(error.message || "Validation failed. Please check your inputs.");
            } else {
                alert(error?.message || "Failed to edit executor. Please try again.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !executor) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Dropdown Backdrop */}
            {openDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenDropdown(null)}
                />
            )}

            {/* Cropper Modal */}
            {cropperOpen && selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    aspect={activeCropType === 'logo' ? 1 : 4}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    objectFit={activeCropType === 'logo' ? 'contain' : 'horizontal-cover'}
                />
            )}

            {/* Success Toast */}
            {isSuccess && (
                <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-top-10 fade-in duration-300">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#11141a] border border-[#10B981]/30 rounded-lg shadow-2xl shadow-[#10B981]/10">
                        <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </div>
                        <p className="text-sm font-mono text-offgray-100">Executor saved successfully.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/studio/executors"
                        className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 hover:text-white transition-colors mb-4 inline-flex items-center gap-2 group"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Back to Executors
                    </Link>
                    <section className="space-y-1">
                        <h1 className="text-3xl font-serif tracking-tight text-offgray-50 flex items-center gap-3">
                            Edit <span className="text-[#10B981]">{executor.name}</span>
                        </h1>
                        <p className="text-sm font-mono text-offgray-500">
                            Modify your executor's brand settings and details.
                        </p>
                    </section>
                </div>
                <Link
                    href={`/studio/executors/${executor.slug}/releases`}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#11141a] hover:bg-white/[0.04] border border-white/[0.06] text-xs font-mono tracking-widest uppercase text-offgray-100 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Manage Releases
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Branding Section */}
                <section className="space-y-6">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                        <span className="text-[#10B981]">01 /</span> Branding
                        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </h2>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Executor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. ScriptHub Executors"
                            className="w-full h-11 px-4 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    {/* Banner Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Banner Art <span className="opacity-50">(4:1)</span>
                        </label>
                        <div className="relative group w-full aspect-[4/1] bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden transition-all hover:border-[#10B981]/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                            {bannerPreview ? (
                                <>
                                    <Image
                                        src={bannerPreview}
                                        alt="Banner preview"
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white px-4 py-2 bg-white/10 rounded-md border border-white/[0.05]">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                            Change Banner
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-offgray-600 gap-2 bg-[url('/grid.svg')] bg-center group-hover:bg-white/[0.02] transition-colors" style={{ backgroundSize: '20px 20px', backgroundPosition: 'center', opacity: 0.5 }}>
                                    <div className="w-10 h-10 rounded-full bg-[#11141A] border border-white/[0.05] flex items-center justify-center group-hover:border-[#10B981]/40 group-hover:text-[#10B981] transition-all shadow-xl">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                            <circle cx="9" cy="9" r="2" />
                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest uppercase">Select Image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => handleImageUpload(e, 'banner')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Brand Logo <span className="opacity-50">(Square)</span>
                        </label>
                        <div className="flex gap-4 items-center p-4 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-colors shadow-sm">
                            <div className="relative group w-16 h-16 bg-[#11141A] border border-white/[0.06] rounded-xl overflow-hidden transition-all hover:border-[#10B981]/40 shrink-0">
                                {logoPreview ? (
                                    <>
                                        <Image
                                            src={logoPreview}
                                            alt="Logo preview"
                                            fill
                                            className="object-cover opacity-90 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-offgray-600 bg-[url('/grid.svg')] bg-center opacity-70 group-hover:opacity-100 group-hover:text-[#10B981] transition-all" style={{ backgroundSize: '8px 8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="bg-[#11141A]">
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                            <line x1="16" x2="22" y1="5" y2="5" />
                                            <line x1="19" x2="19" y1="2" y2="8" />
                                        </svg>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => handleImageUpload(e, 'logo')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-offgray-400 font-mono tracking-tight">Main identifier icon across the system.</p>
                                <p className="text-[10px] text-offgray-600 mt-1">Recommended: 512×512px. Max: 1MB.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Details Section */}
                <section className="space-y-6">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                        <span className="text-[#10B981]">02 /</span> Specifications
                        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </h2>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe why users should download your executor..."
                            className="w-full px-4 py-3 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Tags <span className="text-offgray-600 lowercase tracking-normal">(Max 3)</span>
                        </label>
                        <div className="w-full min-h-[44px] px-3 py-2 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus-within:border-[#10B981]/40 focus-within:ring-1 focus-within:ring-[#10B981]/20 rounded-lg transition-all shadow-inner flex flex-wrap gap-2 items-center">
                            {tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-mono">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-white transition-colors focus:outline-none"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                disabled={tags.length >= 3}
                                placeholder={tags.length < 3 ? (tags.length === 0 ? "e.g. lvl 7, lvl 8, keyless (Press Enter)" : "Add another tag...") : "Limit reached"}
                                className="flex-1 min-w-[120px] bg-transparent text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                Official Website <span className="text-offgray-600 lowercase tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-offgray-500 text-sm">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                </div>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full h-11 pl-10 pr-4 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                Discord Server <span className="text-offgray-600 lowercase tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5865F2] opacity-70">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                                </div>
                                <input
                                    type="url"
                                    value={discord}
                                    onChange={(e) => setDiscord(e.target.value)}
                                    placeholder="https://discord.gg/..."
                                    className="w-full h-11 pl-10 pr-4 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status & Pricing */}
                <section className="space-y-6">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                        <span className="text-[#10B981]">03 /</span> Availability
                        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                Current Status
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                                className="w-full h-11 px-4 flex items-center justify-between gap-2 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 rounded-lg text-sm font-mono tracking-tight text-offgray-100 transition-all shadow-inner text-left"
                            >
                                <span className="truncate">{status}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-offgray-500 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            {openDropdown === 'status' && (
                                <div className="absolute z-50 w-full bottom-full mb-2 bg-[#11141A] border border-white/[0.06] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1 origin-bottom">
                                    {['Working', 'Updating', 'Patched'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => { setStatus(option); setOpenDropdown(null); }}
                                            className={`w-full px-4 py-2.5 text-left text-sm font-mono tracking-tight hover:bg-white/[0.02] transition-colors ${status === option ? 'text-[#10B981] bg-[#10B981]/5' : 'text-offgray-300'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Platform (Multi-Select) */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                Supported Platforms
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'platform' ? null : 'platform')}
                                className="w-full min-h-[44px] px-4 py-2 flex items-center justify-between gap-2 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 rounded-lg text-sm font-mono tracking-tight text-offgray-100 transition-all shadow-inner text-left"
                            >
                                <span className="truncate flex-1">
                                    {platforms.length > 0 ? platforms.join(', ') : 'Select Platform(s)'}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-offgray-500 transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            {openDropdown === 'platform' && (
                                <div className="absolute z-50 w-full bottom-full mb-2 bg-[#11141A] border border-white/[0.06] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1 origin-bottom">
                                    {['Windows', 'Android', 'iOS', 'Mac OS', 'Linux', 'Web'].map((option) => {
                                        const isSelected = platforms.includes(option);
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePlatform(option);
                                                }}
                                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm font-mono tracking-tight hover:bg-white/[0.02] transition-colors ${isSelected ? 'text-[#10B981] bg-[#10B981]/5' : 'text-offgray-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#10B981] border-[#10B981] text-[#11141A]' : 'border-white/[0.1] bg-[#0a0c10]'}`}>
                                                    {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                                                </div>
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                License Model
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                                className="w-full h-11 px-4 flex items-center justify-between gap-2 bg-[#0a0c10] border border-white/[0.04] hover:border-white/[0.08] focus:border-[#10B981]/40 rounded-lg text-sm font-mono tracking-tight text-offgray-100 transition-all shadow-inner text-left"
                            >
                                <span className="truncate">
                                    {price === 'Free' ? 'Free (w/ Key System)' : price === 'Keyless' ? 'Free (Keyless)' : 'Paid (Premium)'}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-offgray-500 transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            {openDropdown === 'price' && (
                                <div className="absolute z-50 w-full bottom-full mb-2 bg-[#11141A] border border-white/[0.06] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1 origin-bottom">
                                    {[
                                        { value: 'Free', label: 'Free (w/ Key System)' },
                                        { value: 'Keyless', label: 'Free (Keyless)' },
                                        { value: 'Paid', label: 'Paid (Premium)' }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => { setPrice(option.value); setOpenDropdown(null); }}
                                            className={`w-full px-4 py-2.5 text-left text-sm font-mono tracking-tight hover:bg-white/[0.02] transition-colors ${price === option.value ? 'text-[#10B981] bg-[#10B981]/5' : 'text-offgray-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <div className="pt-4 flex flex-col sm:flex-row justify-end border-t border-white/[0.06] mt-8 pt-6">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="group relative h-11 w-full sm:w-auto px-8 bg-[#059669] text-white text-xs font-mono uppercase tracking-widest rounded-md hover:bg-[#10B981] transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-[#10B981]/10"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
