"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { dataURLtoBlob } from "@/lib/utils/cropImage";
import { hubsApi } from "@/lib/api/hubs";
import { authApi } from "@/lib/api/auth";

export default function HubRegistrationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [existingHub, setExistingHub] = useState<any>(null);
    const [checkingHubs, setCheckingHubs] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [discordServer, setDiscordServer] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Check for existing hubs and auth user
    useEffect(() => {
        const checkExistingHubs = async () => {
            try {
                setUser(authApi.getStoredUser());

                const hubs = await hubsApi.getMyHubs();
                if (hubs && hubs.length > 0) {
                    setExistingHub(hubs[0]);
                    setName(hubs[0].name);
                    setIsSuccess(true);
                }
            } catch (error) {
                // error silently handled
            } finally {
                setCheckingHubs(false);
            }
        };

        checkExistingHubs();
    }, []);

    // Form Data
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeCropType, setActiveCropType] = useState<'logo' | 'banner'>('logo');

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
        setIsLoading(true);
        setErrors({});

        try {
            const hubData: any = {
                name,
                description,
                discordServer,
            };

            if (bannerPreview) {
                hubData.banner = dataURLtoBlob(bannerPreview);
            }
            if (logoPreview) {
                hubData.logo = dataURLtoBlob(logoPreview);
            }

            const newHub = await hubsApi.createHub(hubData);

            setExistingHub(newHub);
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error: any) {
            // error silently handled

            if (error.error === "ValidationError" && Array.isArray(error.details)) {
                const newErrors: Record<string, string> = {};
                error.details.forEach((err: any) => {
                    const field = err.path || err.field;
                    const msg = err.msg || err.message;
                    if (field) {
                        newErrors[field] = msg;
                    }
                });
                setErrors(newErrors);
            } else if (error.error === "LimitExceeded") {
                alert("You already have a hub. Redirecting...");
                window.location.reload();
            } else {
                alert(error.message || "Failed to create hub. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingHubs) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest">Checking Auth...</p>
                </div>
            </div>
        );
    }

    // Attempt to determine if the user logged in via Discord. 
    // In many typical implementations, Discord users have a Discord CDN avatar or specific roles.
    const isDiscordUser = user?.avatarUrl?.includes('discord') || false;

    if (!document.cookie.includes('scripthub_user')) {
        // Hydration check fallback if needed, but we rely on user object
    }

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
                        To maintain a high-quality ecosystem and thoroughly review new Collectives, maintaining a verified <span className="text-[#5865F2] font-semibold border-b border-[#5865F2]/40 pb-0.5">Discord connection</span> is mandatory. <br />
                        <br />
                        Please log out and sign in using Discord OAuth to register a Hub.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/studio/hubs"
                        className="h-10 px-6 rounded-md bg-[#0a0c10] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.1] text-offgray-400 hover:text-white flex items-center transition-all w-full sm:w-auto justify-center font-mono text-xs uppercase tracking-widest"
                    >
                        Go Back
                    </Link>
                    <button
                        onClick={async () => {
                            await authApi.logout();
                            window.location.href = "/";
                        }}
                        className="h-10 px-6 rounded-md bg-[#11141A] border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center justify-center transition-all font-mono text-xs uppercase tracking-widest w-full sm:w-auto"
                    >
                        Sign Out & Reauthenticate
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess && existingHub) {
        const isPending = existingHub.status === 'pending';

        return (
            <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-xl ${isPending ? 'bg-[#11141A] border-amber-500/20 text-amber-400' : 'bg-[#11141A] border-[#10B981]/20 text-[#10B981]'}`}>
                    {isPending ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    )}
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-2xl font-serif tracking-tight text-offgray-50">
                        {isPending ? 'Application Pending' : 'Hub Registered!'}
                    </h2>
                    <p className="text-sm font-mono text-offgray-500 max-w-sm mx-auto">
                        Your hub <span className="text-offgray-200">{existingHub.name}</span> is currently {isPending ? (
                            <span className="text-amber-400 uppercase tracking-widest text-[10px]">Under Review</span>
                        ) : (
                            <span className="text-[#10B981] uppercase tracking-widest text-[10px]">{existingHub.status}</span>
                        )}.
                    </p>
                    {isPending && (
                        <p className="text-[11px] font-mono text-offgray-600 mt-2">
                            Only one hub allowed per account concurrently.
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 font-mono text-xs uppercase tracking-widest">
                    <Link
                        href="/studio/hubs"
                        className="h-10 px-6 rounded-md bg-[#0a0c10] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.1] text-offgray-400 hover:text-white flex items-center transition-all w-full sm:w-auto justify-center"
                    >
                        View Collectives
                    </Link>
                    <Link
                        href="/studio"
                        className="h-10 px-6 rounded-md bg-[#059669] text-white hover:bg-[#10B981] flex items-center transition-all w-full sm:w-auto justify-center"
                    >
                        Dashboard Home
                    </Link>
                </div>
            </div>
        );
    }

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
                <section className="space-y-1">
                    <h1 className="text-3xl font-serif tracking-tight text-offgray-50">Initialize Hub</h1>
                    <p className="text-sm font-mono text-offgray-500">
                        Create a centralized brand for your payload suite.
                    </p>
                </section>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Branding Section */}
                <section className="space-y-6">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-offgray-400 flex items-center gap-3">
                        <span className="text-[#10B981]">01 /</span> Branding
                        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                    </h2>

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
                        <p className="text-[10px] font-mono text-offgray-600 block">Recommended: 1200×300px. Max: 2MB.</p>
                    </div>

                    {/* Logo Upload - Bento Style */}
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

                {/* Submit */}
                <div className="pt-4 flex flex-col sm:flex-row justify-end border-t border-white/[0.06] mt-8 pt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative h-11 w-full sm:w-auto px-8 bg-[#059669] text-white text-xs font-mono uppercase tracking-widest rounded-md hover:bg-[#10B981] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-[#10B981]/10"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Create Hub
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
