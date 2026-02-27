"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAllHubs, Hub } from "@/lib/api/hubs";
import { getStorageUrl } from "@/lib/utils/image";

export default function HubsPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const data = await getAllHubs();
        setHubs(data);
      } catch (error) {
        // error silently handled
      } finally {
        setIsLoading(false);
      }
    };

    fetchHubs();
  }, []);

  const officialHubs = hubs.filter((hub) => hub.isOfficial);
  const communityHubs = hubs.filter((hub) => !hub.isOfficial);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-1.5">
        <h1 className="heading-base text-2xl">Hubs</h1>
        <p className="text-sm text-offgray-500">
          Browse official and community script hubs
        </p>
      </section>

      {/* Official Hubs */}
      {officialHubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-offgray-200">
              Official Hubs
            </h2>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {officialHubs.map((hub) => (
              <HubCard key={hub.id} hub={hub} />
            ))}
          </div>
        </section>
      )}

      {/* Community Hubs */}
      {communityHubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-offgray-200">
              Community Hubs
            </h2>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {communityHubs.map((hub) => (
              <HubCard key={hub.id} hub={hub} />
            ))}
          </div>
        </section>
      )}

      {hubs.length === 0 && (
        <div className="text-center py-12 text-offgray-500">
          <p>No hubs found yet.</p>
        </div>
      )}
    </div>
  );
}

function HubCard({ hub }: { hub: Hub }) {
  return (
    <Link
      href={`/h/${hub.slug}`}
      className="group block rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-200 hover:border-emerald-500/30"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {hub.bannerUrl ? (
          <Image
            src={getStorageUrl(hub.bannerUrl)}
            alt={`${hub.name} banner`}
            fill
            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-gray-900" />
        )}
      </div>

      {/* Content */}
      <div className="relative px-4 pb-4">
        {/* Logo - overlap banner */}
        <div className="-mt-8 mb-3">
          <div className="w-16 h-16 rounded-xl border-4 border-[#0a0c0f] bg-surface-panel overflow-hidden relative">
            {hub.logoUrl ? (
              <Image
                src={getStorageUrl(hub.logoUrl)}
                alt={`${hub.name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-ground text-offgray-500 font-bold text-xl">
                {hub.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Hub Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-medium text-offgray-50 group-hover:text-white transition-colors truncate max-w-full">
              {hub.name}
            </h3>
            {/* Badges beside name */}
            {hub.isVerified && (
              <div className="group/tooltip relative">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z" fill="none" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            )}
            {hub.isOfficial && (
              <div className="group/tooltip relative">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-offgray-500 leading-relaxed line-clamp-2 min-h-[32px]">
            {hub.description || "No description provided."}
          </p>

          {/* Stats if available (mocking for now since API doesn't return counts yet) */}
          {/* <div className="flex items-center gap-1 text-[11px] text-offgray-600 pt-1"> ... </div> */}
        </div>
      </div>
    </Link>
  );
}
