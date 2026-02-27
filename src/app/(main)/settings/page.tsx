"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi, User } from "@/lib/api/auth";
import { getStorageUrl } from "@/lib/utils/image";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { dataURLtoBlob } from "@/lib/utils/cropImage";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit states
    const [displayName, setDisplayName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!authApi.isAuthenticated()) {
            router.push("/home");
            return;
        }
        const storedUser = authApi.getStoredUser();
        setUser(storedUser);
        setDisplayName(storedUser?.displayName || "");
        setIsLoading(false);
    }, [router]);

    const showMessage = (type: "success" | "error", msg: string) => {
        if (type === "success") {
            setSuccessMessage(msg);
            setErrorMessage(null);
        } else {
            setErrorMessage(msg);
            setSuccessMessage(null);
        }
        setTimeout(() => {
            setSuccessMessage(null);
            setErrorMessage(null);
        }, 4000);
    };

    const handleSaveDisplayName = async () => {
        if (!displayName.trim() || displayName === user?.displayName) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        try {
            const result = await authApi.updateProfile({ displayName: displayName.trim() });
            setUser(result.user);
            setIsEditingName(false);
            showMessage("success", "Display name updated successfully");
            window.dispatchEvent(new Event('auth-change'));
        } catch (err: any) {
            showMessage("error", err?.message || "Failed to update display name");
        } finally {
            setIsSavingName(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith("image/")) {
            showMessage("error", "Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage("error", "Image must be less than 5MB");
            return;
        }

        // Read file as data URL for cropping
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setCropImageSrc(reader.result as string);
        });
        reader.readAsDataURL(file);

        // Reset file input so same file can be selected again if needed
        e.target.value = "";
    };

    const handleCropComplete = async (croppedImageBase64: string) => {
        setCropImageSrc(null); // Close cropper
        setIsUploadingAvatar(true);

        try {
            // Convert base64 to Blob
            const blob = dataURLtoBlob(croppedImageBase64);
            const file = new File([blob], "avatar.png", { type: "image/png" });

            const result = await authApi.uploadAvatar(file);
            setUser(result.user);
            showMessage("success", "Avatar updated successfully");
            window.dispatchEvent(new Event('auth-change'));
        } catch (err: any) {
            showMessage("error", err?.message || "Failed to upload avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCropCancel = () => {
        setCropImageSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="space-y-1.5">
                <h1 className="heading-base text-2xl">Settings</h1>
                <p className="text-sm text-offgray-500">
                    Manage your profile information and account settings.
                </p>
            </section>

            {/* Toast Messages */}
            {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 animate-in fade-in duration-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 animate-in fade-in duration-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    {errorMessage}
                </div>
            )}

            {/* Image Cropper Modal */}
            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspect={1}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    objectFit="contain"
                />
            )}

            {/* Profile Card */}
            <section className="space-y-5">
                <div className="flex items-center gap-3 pb-1">
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <h2 className="heading-base text-lg">Profile</h2>
                </div>

                <div className="p-5 bg-surface-panel border border-white/[0.06] rounded-lg space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleAvatarClick}
                            disabled={isUploadingAvatar}
                            className="group relative w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-emerald-500/30 transition-all"
                        >
                            {isUploadingAvatar ? (
                                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            ) : (
                                <>
                                    {user.avatarUrl ? (
                                        <Image
                                            src={getStorageUrl(user.avatarUrl)}
                                            alt={user.displayName}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-xl font-medium text-offgray-300">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                </>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <div>
                            <p className="text-sm font-medium text-offgray-200">Profile Picture</p>
                            <p className="text-[11px] text-offgray-500 mt-0.5">
                                Click avatar to change. Max 5MB, JPG/PNG.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    {/* Display Name - Editable */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-offgray-600 uppercase tracking-wider">
                            Display Name
                        </label>
                        <div className="flex items-center gap-2">
                            {isEditingName ? (
                                <>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        maxLength={100}
                                        className="flex-1 px-3 py-2 rounded-md bg-white/[0.06] border border-white/[0.1] text-[13px] text-offgray-100 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveDisplayName();
                                            if (e.key === "Escape") {
                                                setDisplayName(user.displayName);
                                                setIsEditingName(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveDisplayName}
                                        disabled={isSavingName}
                                        className="h-[34px] px-3 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {isSavingName ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDisplayName(user.displayName);
                                            setIsEditingName(false);
                                        }}
                                        className="h-[34px] px-3 bg-white/[0.04] text-offgray-400 text-xs font-medium rounded-md border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1 px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[13px] text-offgray-200 truncate">
                                        {user.displayName}
                                    </div>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="h-[34px] px-3 bg-white/[0.04] text-offgray-400 text-xs font-medium rounded-md border border-white/[0.06] hover:bg-white/[0.08] hover:text-offgray-200 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Read-only Fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-offgray-600 uppercase tracking-wider">
                                Username
                            </label>
                            <div className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[13px] text-offgray-200 truncate">
                                @{user.username}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-offgray-600 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[13px] text-offgray-200 truncate">
                                {user.email || "No email linked"}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-offgray-600 uppercase tracking-wider">
                                User ID
                            </label>
                            <div className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-offgray-200 truncate font-mono">
                                {user.id ? String(user.id).substring(0, 8) : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Account Section */}
            <section className="space-y-5">
                <div className="flex items-center gap-3 pb-1">
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h2 className="heading-base text-lg">Account</h2>
                </div>

                <div className="p-5 bg-surface-panel border border-white/[0.06] rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-offgray-50">
                                Log out of your account
                            </h3>
                            <p className="text-xs text-offgray-500 mt-0.5">
                                You will be redirected to the home page.
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                await authApi.logout();
                                window.location.href = "/";
                            }}
                            className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3.5 py-2 hover:bg-red-500/20 hover:border-red-500/30 transition-colors duration-100"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
