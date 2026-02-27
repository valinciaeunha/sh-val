"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { dataURLtoBlob } from "@/lib/utils/cropImage";
import { hubsApi, Hub } from "@/lib/api/hubs";
import { getStorageUrl } from "@/lib/utils/image";

export default function EditHubPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [hub, setHub] = useState<any>(null);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [discordServer, setDiscordServer] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Image State
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeCropType, setActiveCropType] = useState<'logo' | 'banner'>('logo');

    useEffect(() => {
        const fetchHub = async () => {
            try {
                const myHubs = await hubsApi.getMyHubs();
                const foundHub = myHubs.find(h => h.slug === slug);

                if (foundHub) {
                    setHub(foundHub);
                    setName(foundHub.name);
                    setDescription(foundHub.description || "");
                    setDiscordServer(foundHub.discordServer || "");
                } else {
                    setErrors({ general: "Hub not found" });
                }
            } catch (err: any) {
                // error silently handled
                setErrors({ general: err.message || "Failed to load hub details." });
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchHub();
        }
    }, [slug]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hub) return;

        setIsSaving(true);
        setIsSaved(false);
        setErrors({});

        try {
            const hubData: any = {
                name,
                description,
                discordServer,
            };

            if (bannerPreview) hubData.banner = dataURLtoBlob(bannerPreview);
            if (logoPreview) hubData.logo = dataURLtoBlob(logoPreview);
            // Assuming bannerToRemove and logoToRemove states exist elsewhere if needed
            // if (bannerToRemove) hubData.remove_banner = true;
            // if (logoToRemove) hubData.remove_logo = true;

            await hubsApi.updateHub(hub.id, hubData);

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);

            router.refresh();
        } catch (err: any) {
            // error silently handled

            if (err.error === "ValidationError" && Array.isArray(err.details)) {
                const newErrors: Record<string, string> = {};
                err.details.forEach((detail: any) => {
                    const field = detail.path || detail.field;
                    const msg = detail.msg || detail.message;
                    if (field) {
                        newErrors[field] = msg;
                    }
                });
                setErrors(newErrors);
            } else {
                setErrors({ general: err.message || "Failed to update hub" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest">Loading Hub Data...</p>
                </div>
            </div>
        );
    }

    if (errors.general || !hub) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                <p className="text-[11px] font-mono tracking-widest uppercase text-red-400">{errors.general || "Hub not found"}</p>
                <Link href="/studio/hubs" className="text-[11px] font-mono tracking-widest uppercase text-[#10B981] hover:text-emerald-400 transition-colors">
                    ← Return to Collectives
                </Link>
            </div>
        );
    }

    const isDirty = hub ? (
        name !== hub.name ||
        description !== (hub.description || "") ||
        discordServer !== (hub.discordServer || "") ||
        logoPreview !== null ||
        bannerPreview !== null
    ) : false;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
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

            {/* Header */}
            <div>
                <Link
                    href="/studio/hubs"
                    className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 hover:text-white transition-colors mb-4 inline-flex items-center gap-2 group"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Collectives
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <section className="space-y-1">
                        <h1 className="text-3xl font-serif tracking-tight text-offgray-50">Edit Collective</h1>
                        <p className="text-sm font-mono text-offgray-500">
                            Update details and branding for <span className="text-[#10B981]">{hub?.name}</span>
                        </p>
                    </section>
                    <Link
                        href={`/h/${hub?.slug}`}
                        target="_blank"
                        className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-offgray-400 hover:text-white hover:border-white/[0.1] hover:bg-white/[0.04] transition-all group"
                        title="View Public Hub"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" x2="21" y1="14" y2="3" />
                        </svg>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Images Section */}
                <section className="space-y-6">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                        <span className="text-[#10B981]">01 /</span> Branding
                        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </h2>

                    {/* Banner Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Banner (4:1)
                        </label>
                        <div className="relative group">
                            <div className="relative w-full aspect-[4/1] rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] overflow-hidden">
                                {(bannerPreview || hub.bannerUrl) ? (
                                    <Image
                                        src={bannerPreview || getStorageUrl(hub.bannerUrl)}
                                        alt="Banner preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-offgray-600">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span className="text-[11px]">Upload Banner</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer h-8 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center transition-colors backdrop-blur-sm">
                                        Change Banner
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'banner')}
                                        />
                                    </label>
                                </div>
                            </div>
                            <p className="mt-1.5 text-[10px] font-mono text-offgray-600">
                                Recommended: 1200×300px. Max: 2MB.
                            </p>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Logo (Square)
                        </label>
                        <div className="flex items-start gap-4">
                            <div className="relative group">
                                <div className="relative w-20 h-20 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] overflow-hidden">
                                    {(logoPreview || hub.logoUrl) ? (
                                        <Image
                                            src={logoPreview || getStorageUrl(hub.logoUrl)}
                                            alt="Logo preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-offgray-600">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'logo')}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-xs text-offgray-400">
                                    Upload a square logo for your hub. Displayed on your hub card and profile.
                                </p>
                                <p className="mt-1 text-[10px] font-mono text-offgray-600">
                                    Recommended: 512×512px. Max: 2MB.
                                </p>
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
                            Hub Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Payloads"
                            className={`w-full h-11 px-4 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner ${errors.name
                                ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]"
                                : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"
                                }`}
                        />
                        {errors.name && (
                            <p className="text-[10px] font-mono text-red-400">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the collective's purpose..."
                            className={`w-full px-4 py-3 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all resize-none shadow-inner ${errors.description
                                ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]"
                                : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"
                                }`}
                        />
                        {errors.description && (
                            <p className="text-[10px] font-mono text-red-400">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                            Support Discord <span className="text-offgray-600 lowercase tracking-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-offgray-500 text-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                            </div>
                            <input
                                type="url"
                                value={discordServer}
                                onChange={(e) => setDiscordServer(e.target.value)}
                                placeholder="https://discord.gg/..."
                                className={`w-full h-11 pl-10 pr-4 bg-[#0a0c10] border rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all shadow-inner ${errors.discordServer
                                    ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 bg-red-500/[0.02]"
                                    : "border-white/[0.04] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 hover:border-white/[0.08]"
                                    }`}
                            />
                        </div>
                        {errors.discordServer && (
                            <p className="text-[10px] font-mono text-red-400">{errors.discordServer}</p>
                        )}
                    </div>
                </section>

                {errors.general && (
                    <div className="p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 text-sm text-center">
                        {errors.general}
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row justify-end border-t border-white/[0.06] mt-8 pt-6">
                    <button
                        type="submit"
                        disabled={isSaving || !isDirty}
                        className={`group relative h-11 w-full sm:w-auto px-8 text-xs font-mono uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-2 overflow-hidden shadow-lg ${!isDirty
                            ? 'bg-white/[0.02] text-offgray-600 border border-white/[0.04] cursor-not-allowed shadow-none'
                            : 'bg-[#059669] text-white hover:bg-[#10B981] shadow-[#10B981]/10 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {isDirty && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={!isDirty ? 'opacity-50' : 'opacity-80'}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
