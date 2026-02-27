"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usersApi, UserProfile } from "@/lib/api/users";
import { Script } from "@/lib/api/scripts";
import { ScriptCard } from "@/components/home/ScriptCard";
import { getStorageUrl } from "@/lib/utils/image";
import { formatRelativeTime } from "@/lib/utils/date";

export default function UserProfilePage() {
    const params = useParams();
    const username = params?.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!username) return;

            try {
                setIsLoading(true);
                const [profileData, scriptsData] = await Promise.all([
                    usersApi.getProfile(username),
                    usersApi.getUserScripts(username)
                ]);

                setProfile(profileData);
                setScripts(scriptsData);
            } catch (err: any) {
                // error silently handled
                setError(err.message || "Failed to load profile");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [username]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="space-y-8">
                <section className="space-y-4 text-center py-12">
                    <h1 className="heading-base text-2xl">{error ? "Error" : "User Not Found"}</h1>
                    <p className="text-sm text-offgray-500">
                        {error || "The user you are looking for does not exist."}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back to Home
                    </Link>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Profile Header Card */}
            <section className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden p-6 md:p-8">
                {/* Subtle glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.06] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    {/* Avatar */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full blur opacity-20" />
                        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/[0.08] bg-surface-panel shadow-xl">
                            {profile.avatarUrl ? (
                                <Image
                                    src={getStorageUrl(profile.avatarUrl)}
                                    alt={profile.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-3xl font-bold text-offgray-400">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-3 min-w-0 flex-1">
                        {/* Name & Username */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-offgray-50 truncate">
                                {profile.displayName || profile.username}
                            </h1>
                            <p className="text-sm text-offgray-500 font-medium">@{profile.username}</p>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-sm text-offgray-400 max-w-2xl leading-relaxed line-clamp-2">
                                {profile.bio}
                            </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-offgray-500 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                <span>{profile.totalScripts} Scripts</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                                <span>{profile.totalViews.toLocaleString()} Views</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                                <span>{profile.totalLikes.toLocaleString()} Likes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                                <span>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scripts Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <h2 className="text-lg font-semibold text-offgray-50">Published Scripts</h2>
                    <span className="text-xs text-offgray-500">{scripts.length} items</span>
                </div>

                {scripts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {scripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                title={script.title}
                                game={script.gameName || "Unknown Game"}
                                gameSlug={script.gameSlug}
                                stars={script.likes}
                                timeAgo={formatRelativeTime(script.createdAt)}
                                tag={script.tags?.[0]?.name}
                                href={`/s/${script.slug}`}
                                color="#10b981"
                                thumbnailUrl={script.thumbnailUrl}
                                fallbackType="icon"
                                isPaid={script.isPaid}
                                hasKeySystem={script.hasKeySystem}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                        <p className="text-offgray-500 text-sm">No scripts have been published yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
