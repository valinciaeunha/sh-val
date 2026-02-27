"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deploymentsApi, type DeploymentStats } from "@/lib/api/deployments";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";

type FileStatus = 'idle' | 'uploading' | 'complete' | 'error';

interface FileUpload {
    file: File;
    progress: number;
    status: FileStatus;
    error?: string;
}

export default function DeploymentsUploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [stats, setStats] = useState<DeploymentStats | null>(null);
    const [planData, setPlanData] = useState<PlanWithMaximums | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial data for quotas
    const loadData = useCallback(async () => {
        setLoadingData(true);
        try {
            const [statsData, plan] = await Promise.all([
                deploymentsApi.getStats(),
                plansApi.getMyPlan(),
            ]);
            setStats(statsData);
            setPlanData(plan);
        } catch (err) {
            // error silently handled
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const maxDeployments = planData?.maximums?.maximum_deployments ?? 3;
    const activeCount = stats?.active_deployments ?? 0;
    const availableSlots = Math.max(0, maxDeployments - activeCount);
    const usagePercentage = maxDeployments > 0 ? (activeCount / maxDeployments) * 100 : 0;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        // Validation for Max 50MB (could also configure depending on plan)
        const MAX_SIZE = 50 * 1024 * 1024;

        // Allowed extensions
        const allowedExtensions = ['.lua', '.luau', '.txt'];

        const validFiles = newFiles.filter(f => {
            const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
            return f.size <= MAX_SIZE && allowedExtensions.includes(ext);
        });

        if (validFiles.length < newFiles.length) {
            alert(`Some files were ignored because they exceed the 50MB limit or have an invalid format. Allowed formats: .lua, .luau, .txt`);
        }

        const mapped = validFiles.map(f => ({ file: f, progress: 0, status: 'idle' as FileStatus }));
        setFiles(prev => [...prev, ...mapped]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const startUpload = () => {
        const pendingFiles = files.filter(f => f.status === 'idle' || f.status === 'error');

        if (pendingFiles.length > availableSlots) {
            alert(`You only have ${availableSlots} deployment slots available. Please remove some files or upgrade your plan.`);
            return;
        }

        // Set status to uploading
        setFiles(prev => prev.map(f => (f.status === 'idle' || f.status === 'error') ? { ...f, status: 'uploading', progress: 0, error: undefined } : f));

        pendingFiles.forEach(async (f) => {
            const formData = new FormData();
            formData.append("file", f.file);
            formData.append("title", f.file.name);

            try {
                await deploymentsApi.upload(formData, (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
                    setFiles(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(item => item.file === f.file);
                        if (idx !== -1 && next[idx].status === 'uploading') {
                            next[idx] = { ...next[idx], progress };
                        }
                        return next;
                    });
                });

                // Completed
                setFiles(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(item => item.file === f.file);
                    if (idx !== -1) {
                        next[idx] = { ...next[idx], status: 'complete', progress: 100 };
                    }
                    return next;
                });

                // Refresh quotas after a successful upload
                loadData();
            } catch (err: any) {
                // error silently handled
                const message = err?.response?.data?.message || "Upload failed";
                setFiles(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(item => item.file === f.file);
                    if (idx !== -1) {
                        next[idx] = { ...next[idx], status: 'error', error: message };
                    }
                    return next;
                });
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <section className="flex flex-col gap-4">
                <Link
                    href="/studio/deployments"
                    className="inline-flex items-center gap-2 text-xs font-mono text-offgray-500 hover:text-white transition-colors group w-fit"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className=" group-hover:-translate-x-0.5 transition-transform">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Deployments
                </Link>
                <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                        Upload Assets
                    </h1>
                    <p className="text-sm font-mono text-offgray-500">
                        Deploy your static assets, images, or script files to our CDN.
                    </p>
                </div>
            </section>

            {/* Upload Zone */}
            <section
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative group cursor-pointer
                    flex flex-col items-center justify-center py-20 px-4 
                    border-2 border-dashed rounded-2xl transition-all duration-500
                    ${isDragging
                        ? 'border-[#10B981] bg-[#10B981]/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
                        : 'border-white/[0.06] bg-[#0a0c10] hover:border-white/[0.12] hover:bg-white/[0.01]'
                    }
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".lua,.luau,.txt,text/plain"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" style={{ backgroundSize: '20px 20px' }} />

                <div className={`
                    w-16 h-16 rounded-2xl bg-[#11141A] border border-white/[0.06] shadow-2xl flex items-center justify-center mb-6 relative z-10 
                    transition-all duration-500 group-hover:scale-110
                    ${isDragging ? 'border-[#10B981]/50 text-[#10B981]' : 'text-offgray-600 group-hover:border-white/20 group-hover:text-offgray-300'}
                `}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>

                <div className="text-center space-y-2 relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                    <h2 className="text-lg font-serif tracking-tight text-offgray-100 group-hover:text-white">
                        {isDragging ? 'Drop Files Here' : 'Drop files or click to browse'}
                    </h2>
                    <p className="text-sm font-mono text-offgray-500">
                        Supports .lua, .luau, and .txt files (Max 50MB per file)
                    </p>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/[0.04] rounded-tl-lg group-hover:border-[#10B981]/20 transition-colors" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/[0.04] rounded-tr-lg group-hover:border-[#10B981]/20 transition-colors" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/[0.04] rounded-bl-lg group-hover:border-[#10B981]/20 transition-colors" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/[0.04] rounded-br-lg group-hover:border-[#10B981]/20 transition-colors" />
            </section>

            {/* File List */}
            {files.length > 0 && (
                <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold text-offgray-500 uppercase tracking-widest pl-1">
                            Selected Files ({files.length})
                        </h3>
                        {files.some(f => f.status === 'idle' || f.status === 'error') && (
                            <button
                                onClick={startUpload}
                                className="h-8 px-4 rounded-lg bg-[#059669] hover:bg-[#10B981] text-[11px] font-bold text-white transition-all shadow-lg shadow-emerald-500/10"
                            >
                                Start Upload
                            </button>
                        )}
                    </div>

                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden shadow-2xl">
                        <div className="divide-y divide-white/[0.02]">
                            {files.map((f, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 group/file relative">
                                    <div className={`w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center transition-colors group-hover/file:border-emerald-500/20 group-hover/file:text-emerald-400 ${f.status === 'error' ? 'text-rose-500 border-rose-500/20' : 'text-offgray-500'}`}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <p className="text-sm font-medium text-offgray-100 truncate">{f.file.name}</p>
                                            <span className="text-[10px] font-mono text-offgray-500 shrink-0">{formatBytes(f.file.size)}</span>
                                        </div>

                                        {f.status === 'idle' ? (
                                            <p className="text-[10px] font-mono text-offgray-600">Pending upload...</p>
                                        ) : f.status === 'error' ? (
                                            <p className="text-[10px] font-mono text-rose-500">{f.error}</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${f.status === 'complete' ? 'bg-[#10B981]' : 'bg-emerald-500'}`}
                                                        style={{ width: `${f.progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-mono ${f.status === 'complete' ? 'text-[#10B981]' : 'text-offgray-400'}`}>
                                                        {f.status === 'complete' ? 'Upload complete' : `Uploading... ${Math.round(f.progress)}%`}
                                                    </p>
                                                    {f.status === 'complete' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(f.status === 'idle' || f.status === 'error') && (
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-offgray-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover/file:opacity-100"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Quota Indicator Section */}
            <section className="p-6 bg-[#11141A] border border-white/[0.04] rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />

                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
                    </svg>
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-semibold text-offgray-100">Maximum Deployment</h4>
                    {loadingData ? (
                        <p className="text-xs font-mono text-offgray-500 animate-pulse">Loading quota info...</p>
                    ) : (
                        <p className="text-xs font-mono text-offgray-500">You are using <span className="text-emerald-400">{activeCount}</span> of your <span className="text-white">{maxDeployments}</span> available deployments.</p>
                    )}
                </div>

                <div className="w-full sm:w-48 space-y-2">
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full ${usagePercentage >= 100 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${Math.min(100, usagePercentage)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-offgray-600 uppercase tracking-tighter">
                        <span>Used: {Math.round(usagePercentage)}%</span>
                        <span>Free: {availableSlots} Slots</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
