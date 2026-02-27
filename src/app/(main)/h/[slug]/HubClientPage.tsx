"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ScriptCard } from "@/components/home/ScriptCard";
import { hubsApi, Hub } from "@/lib/api/hubs";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { getStorageUrl } from "@/lib/utils/image";
import { formatRelativeTime } from "@/lib/utils/date";

const SCRIPTS_PER_PAGE = 30;

export default function HubDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [hub, setHub] = useState<Hub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);

  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHubDetail = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        const hubData = await hubsApi.getHubBySlug(slug);
        setHub(hubData);

        if (hubData.status !== "suspended") {
          const scriptsData = await scriptsApi.getAllScripts({ hubId: hubData.id, page: 1, limit: SCRIPTS_PER_PAGE });
          setScripts(scriptsData.scripts);
          setHasMore(scriptsData.pagination.hasMore);
          setTotalScripts(scriptsData.pagination.total);
          setPage(1);
        }

      } catch (err: any) {
        const message = err?.message || err?.error || "Hub not found";
        const statusCode = err?.statusCode;
        if (statusCode === 404) {
          setError("This hub doesn't exist or is not yet active.");
        } else {
          // error silently handled
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHubDetail();
  }, [slug]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !hub) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await scriptsApi.getAllScripts({ hubId: hub.id, page: nextPage, limit: SCRIPTS_PER_PAGE });
      setScripts(prev => [...prev, ...result.scripts]);
      setHasMore(result.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      // error silently handled
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, hub]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !hub) {
    return (
      <div className="space-y-8">
        <section className="space-y-4 text-center py-12">
          <h1 className="heading-base text-2xl">{error ? "Error" : "Hub Not Found"}</h1>
          <p className="text-sm text-offgray-500">
            {error || "The hub you're looking for doesn't exist."}
          </p>
          <Link
            href="/hubs"
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Hubs
          </Link>
        </section>
      </div>
    );
  }

  if (hub.status === "suspended") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <section className="space-y-4 text-center py-20 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-white">Hub Suspended</h1>
          <p className="text-sm text-rose-300 max-w-md mx-auto">
            This hub has been suspended due to violations of our Terms of Service. All access to this hub and its scripts has been restricted.
          </p>
          <div className="pt-6">
            <Link
              href="/hubs"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Return to Hubs
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Description Modal Popup */}
      {isDescModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsDescModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface-panel border border-border-subtle rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-offgray-50">About {hub.name}</h2>
              <button
                onClick={() => setIsDescModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-offgray-500 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <p className="text-[13px] text-offgray-400 leading-relaxed whitespace-pre-wrap">
                {hub.description || "No description provided."}
              </p>
            </div>
            <div className="px-4 py-3 bg-white/[0.02] flex justify-end">
              <button
                onClick={() => setIsDescModalOpen(false)}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <Link
        href="/hubs"
        className="inline-flex items-center gap-2 text-sm text-offgray-500 hover:text-offgray-300 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Hubs
      </Link>

      {/* Hub Header Card */}
      <section className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 md:h-48 bg-gradient-to-br from-gray-800 to-gray-900">
          {hub.bannerUrl && (
            <Image
              src={getStorageUrl(hub.bannerUrl)}
              alt={`${hub.name} banner`}
              fill
              priority
              className="object-cover opacity-60"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] to-transparent" />
        </div>

        {/* Header Content Area */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo - Overlapping Banner */}
            <div className="-mt-12 md:-mt-16 w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-[#0a0c0f] bg-surface-panel shadow-2xl overflow-hidden relative shrink-0 z-10">
              {hub.logoUrl ? (
                <Image
                  src={getStorageUrl(hub.logoUrl)}
                  alt={`${hub.name} logo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100px, 128px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-ground text-offgray-500 font-bold text-3xl">
                  {hub.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Hub Info & Actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 md:pt-4">
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex items-center justify-between md:justify-start gap-3 w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-offgray-50 truncate">
                      {hub.name}
                    </h1>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hub.isVerified && (
                        <div className="group/tooltip relative">
                          <svg className="w-5 h-5 text-blue-400 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                      )}
                      {hub.isOfficial && (
                        <div className="group/tooltip relative">
                          <svg className="w-5 h-5 text-amber-400 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions - Mobile Only visible here */}
                  <div className="md:hidden">
                    <button className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg active:scale-95">
                      Join
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm text-offgray-400 max-w-2xl leading-relaxed line-clamp-2">
                    {hub.description || "No description provided."}
                  </p>
                  {hub.description && hub.description.length > 80 && (
                    <button
                      onClick={() => setIsDescModalOpen(true)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                    >
                      view details
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-offgray-500">
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span>{totalScripts} Scripts</span>
                  </div>
                  {hub.discordServer && (
                    <a
                      href={hub.discordServer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                      <span>Discord Server</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Actions - Desktop Only */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <button className="h-10 px-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all shadow-lg hover:translate-y-[-1px] active:translate-y-[0px]">
                  Join Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scripts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <h2 className="text-lg font-semibold text-offgray-50">Published Scripts</h2>
          <span className="text-xs text-offgray-500">{totalScripts} items</span>
        </div>

        {scripts && scripts.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {scripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  title={script.title}
                  game={script.gameName || "Unknown Game"}
                  stars={script.views}
                  statType="views"
                  timeAgo={formatRelativeTime(script.createdAt)}
                  color="#14291e"
                  href={`/s/${script.slug}`}
                  gameSlug={script.gameSlug}
                  thumbnailUrl={script.thumbnailUrl}
                  fallbackType="icon"
                  isPaid={script.isPaid}
                  hasKeySystem={script.hasKeySystem}
                />
              ))}
            </div>

            {hasMore && (
              <div
                ref={sentinelRef}
                className="w-full py-12 flex justify-center items-center"
              >
                {isLoadingMore ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
                    <span className="text-xs font-mono text-offgray-500 uppercase tracking-widest">Loading scripts</span>
                  </div>
                ) : (
                  <div className="h-6" /> // Empty placeholder to trigger intersection
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
            <p className="text-offgray-500 text-sm">No scripts have been published to this hub yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
