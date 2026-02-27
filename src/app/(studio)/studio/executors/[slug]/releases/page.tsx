"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getExecutorBySlug, addExecutorVersion, updateExecutorVersion, deleteExecutorVersion, Executor } from "@/lib/api/executors";
import { formatDistanceToNow } from "date-fns";
import { authApi } from "@/lib/api/auth";

export default function ExecutorReleasesPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [executor, setExecutor] = useState<Executor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setUser(authApi.getStoredUser());
    }, []);

    // Modal State
    const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
    const [newVersion, setNewVersion] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

    const fetchExecutor = async () => {
        try {
            const data = await getExecutorBySlug(slug);
            setExecutor(data);
        } catch (error) {
            // error silently handled
            // If not found, redirect back
            router.push("/studio/executors");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (slug) {
            fetchExecutor();
        }
    }, [slug, router]);

    const handleAddVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVersion || !newUrl) return;

        setIsSubmitting(true);
        try {
            await addExecutorVersion(slug, {
                version: newVersion,
                downloadUrl: newUrl,
                patchNotes: newNotes
            });

            // Refresh executor data to show new version
            await fetchExecutor();

            // Reset form and close modal
            setIsAddVersionModalOpen(false);
            setNewVersion("");
            setNewUrl("");
            setNewNotes("");
        } catch (error) {
            // error silently handled
            alert("Failed to add version. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (ver: any) => {
        setEditingVersionId(ver.id);
        setNewVersion(ver.version);
        setNewUrl(ver.downloadUrl || ver.download_url || "");
        setNewNotes(ver.patchNotes || ver.patch_notes || "");
        setIsEditModalOpen(true);
    };

    const handleEditVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVersion || !newUrl || !editingVersionId || !executor?.id) return;

        setIsSubmitting(true);
        try {
            await updateExecutorVersion(executor.id.toString(), editingVersionId, {
                version: newVersion,
                downloadUrl: newUrl,
                patchNotes: newNotes
            });

            await fetchExecutor();

            setIsEditModalOpen(false);
            setEditingVersionId(null);
            setNewVersion("");
            setNewUrl("");
            setNewNotes("");
        } catch (error) {
            // error silently handled
            alert("Failed to update version. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteVersion = (versionId: string) => {
        setVersionToDelete(versionId);
    };

    const handleDeleteVersion = async () => {
        if (!executor?.id || !versionToDelete) return;

        setIsDeletingId(versionToDelete);
        try {
            await deleteExecutorVersion(executor.id.toString(), versionToDelete);
            await fetchExecutor();
            setVersionToDelete(null);
        } catch (error) {
            // error silently handled
            alert("Failed to delete version. Please try again.");
        } finally {
            setIsDeletingId(null);
        }
    };

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
                        Please log out and sign in using Discord OAuth to manage your Executor releases.
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
            </div>
        );
    }

    if (!executor) return null;

    const versions = executor.versions || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <section className="space-y-1">
                        <h1 className="text-3xl font-serif tracking-tight text-offgray-50 flex items-center gap-3">
                            <span className="text-[#10B981]">{executor.name}</span> Releases
                        </h1>
                        <p className="text-sm font-mono text-offgray-500">
                            Manage version history and download links for your executor.
                        </p>
                    </section>
                    <button
                        onClick={() => {
                            setNewVersion("");
                            setNewUrl("");
                            setNewNotes("");
                            setIsAddVersionModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#059669] hover:bg-[#10B981] text-xs font-medium text-white transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/40"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Release
                    </button>
                </div>
            </div>

            {/* Releases List */}
            <div className="bg-[#11141A] border border-white/[0.04] rounded-xl overflow-hidden shadow-xl">
                {versions.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center mb-4 border border-white/[0.05]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-serif text-offgray-100 mb-2">No Releases Found</h3>
                        <p className="text-sm font-mono text-offgray-500 max-w-sm">
                            You haven't published any versions for this executor yet.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {versions.map((ver, index) => (
                            <div key={ver.id} className="p-5 sm:p-6 hover:bg-white/[0.01] transition-colors group">
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-mono font-medium text-[#10B981]">{ver.version}</h3>
                                            {index === 0 && (
                                                <span className="inline-flex items-center px-2 h-5 rounded bg-[#10B981]/10 text-[#10B981] text-[10px] uppercase tracking-widest font-mono border border-[#10B981]/20">
                                                    Latest
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs font-mono text-offgray-500 bg-black/20 px-3 py-2 rounded-lg border border-white/[0.02] inline-block truncate max-w-full">
                                            <span className="text-offgray-600 mr-2">URL:</span>
                                            <a href={ver.downloadUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors truncate">
                                                {ver.downloadUrl}
                                            </a>
                                        </div>
                                        {ver.patchNotes && (
                                            <div className="text-sm text-offgray-400 mt-2 bg-white/[0.02] p-4 rounded-lg border border-white/[0.04] max-w-2xl whitespace-pre-wrap">
                                                {ver.patchNotes}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                                        <span className="text-[11px] font-mono text-offgray-500">
                                            {formatDistanceToNow(new Date(ver.createdAt), { addSuffix: true })}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(ver)}
                                                className="p-2 text-offgray-500 hover:text-white rounded transition-colors"
                                                title="Edit Release"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            {Date.now() - new Date(ver.createdAt).getTime() < 60 * 60 * 1000 && (
                                                <button
                                                    onClick={() => confirmDeleteVersion(ver.id)}
                                                    disabled={isDeletingId === ver.id}
                                                    className="p-2 text-offgray-500 hover:text-red-400 rounded transition-colors disabled:opacity-50"
                                                    title="Delete Release (Available for 1 hour after upload)"
                                                >
                                                    {isDeletingId === ver.id ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Version Modal */}
            {(isAddVersionModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div
                        className="absolute inset-0"
                        onClick={() => {
                            if (!isSubmitting) {
                                setIsAddVersionModalOpen(false);
                                setIsEditModalOpen(false);
                            }
                        }}
                    />
                    <div className="relative w-full max-w-lg bg-[#0a0c10] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0d1015]">
                            <h2 className="text-sm font-mono tracking-widest uppercase text-offgray-100 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                {isEditModalOpen ? "Edit Release" : "Publish New Update"}
                            </h2>
                            <button
                                onClick={() => {
                                    if (!isSubmitting) {
                                        setIsAddVersionModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }
                                }}
                                className="text-offgray-500 hover:text-white p-1 rounded-md transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={isEditModalOpen ? handleEditVersion : handleAddVersion} className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="w-1/3 space-y-2">
                                    <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                        Build Version <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newVersion}
                                        onChange={(e) => setNewVersion(e.target.value)}
                                        placeholder="e.g. 1.6.0"
                                        className="w-full h-10 px-3 bg-[#11141A] border border-white/[0.06] hover:border-white/[0.1] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                        Direct Download URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://your-domain.com/download..."
                                        className="w-full h-10 px-3 bg-[#11141A] border border-white/[0.06] hover:border-white/[0.1] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest block">
                                    Patch Notes / Changelog
                                </label>
                                <textarea
                                    rows={4}
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    placeholder="- Added support for...\n- Fixed crashing issue on..."
                                    className="w-full px-3 py-3 bg-[#11141A] border border-white/[0.06] hover:border-white/[0.1] focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 rounded-lg text-sm font-mono tracking-tight text-offgray-100 placeholder-offgray-600 focus:outline-none transition-all resize-none"
                                />
                                <p className="text-[10px] text-offgray-600 font-mono tracking-tight">Users will see this on the executor details page.</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) {
                                            setIsAddVersionModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }
                                    }}
                                    className="h-10 px-5 text-offgray-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-10 px-6 bg-[#059669] text-white text-xs font-mono uppercase tracking-widest rounded-md hover:bg-[#10B981] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {isEditModalOpen ? "Saving" : "Publishing"}
                                        </>
                                    ) : (
                                        isEditModalOpen ? "Save Changes" : "Publish Update"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {versionToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => {
                            if (!isDeletingId) setVersionToDelete(null);
                        }}
                    />
                    <div className="relative w-full max-w-sm bg-[#0a0c10] border border-white/[0.08] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="p-6 space-y-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-serif text-white mb-2">Delete Release</h3>
                                <p className="text-[12px] text-offgray-400 leading-relaxed">
                                    Are you sure you want to delete this release? This action cannot be undone and users will no longer be able to download this version.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setVersionToDelete(null)}
                                    disabled={isDeletingId !== null}
                                    className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteVersion}
                                    disabled={isDeletingId !== null}
                                    className="flex-1 h-10 rounded-lg bg-red-500/90 hover:bg-red-500 text-sm font-bold text-white transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {isDeletingId !== null ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting
                                        </>
                                    ) : (
                                        "Delete"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
