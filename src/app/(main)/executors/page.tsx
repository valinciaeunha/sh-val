"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { getAllExecutors, Executor } from "@/lib/api/executors";
import { getStorageUrl } from "@/lib/utils/image";

const PLATFORMS = ["All", "Windows", "Mac", "Android", "iOS", "Linux"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Working: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  Updating: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  Patched: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  Discontinued: { bg: "bg-offgray-500/10", text: "text-offgray-400", dot: "bg-offgray-500" },
  Pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
};

export default function ExecutorsPage() {
  const [platformFilter, setPlatformFilter] = useState("All");
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExecutors = async () => {
      try {
        const data = await getAllExecutors();
        setExecutors(data);
      } catch (error) {
        // error silently handled
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecutors();
  }, []);

  const filteredExecutors =
    platformFilter === "All"
      ? executors
      : executors.filter((e) => e.platforms?.includes(platformFilter));

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-1.5">
        <h1 className="heading-base text-2xl">Executors</h1>
        <p className="text-sm text-offgray-500">
          Verified executors ranked by stability and features
        </p>
      </section>

      {/* Filters */}
      <section className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setPlatformFilter(platform)}
            className={[
              "text-[13px] tracking-tight whitespace-nowrap rounded-md h-8 px-3 transition-colors duration-100 select-none",
              platformFilter === platform
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-offgray-500 hover:text-offgray-300 hover:bg-white/[0.04]",
            ].join(" ")}
          >
            {platform}
          </button>
        ))}
      </section>

      {/* Executors Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filteredExecutors.length === 0 ? (
        <div className="text-center py-20 text-offgray-500 font-mono text-sm border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01]">
          No executors found matching this platform.
        </div>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredExecutors.map((executor) => {
            const statusStyle =
              STATUS_CONFIG[executor.status] || STATUS_CONFIG["Working"];

            return (
              <Link
                key={executor.id}
                href={`/executors/${executor.slug}`}
                className="group flex flex-col w-full bg-surface-panel border border-border-subtle rounded-lg overflow-hidden hover:border-offgray-700 transition-colors duration-100 select-none h-full relative"
              >
                {/* Thumbnail area */}
                <div
                  className="relative w-full h-[100px] bg-[#11141A] overflow-hidden"
                >
                  {executor.bannerUrl ? (
                    <Image
                      src={getStorageUrl(executor.bannerUrl)}
                      alt={executor.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    /* Pattern */
                    <div className="absolute inset-0 opacity-10">
                      <svg
                        width="100%"
                        height="100%"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <pattern
                            id={`g-${executor.id}`}
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 20 0 L 0 0 0 20"
                              fill="none"
                              stroke="white"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect
                          width="100%"
                          height="100%"
                          fill={`url(#g-${executor.id})`}
                        />
                      </svg>
                    </div>
                  )}

                  {/* Top corner badging */}
                  <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                    {executor.logoUrl && (
                      <div className="w-6 h-6 rounded overflow-hidden relative shadow-md bg-black/50 backdrop-blur-md border border-white/10">
                        <Image src={getStorageUrl(executor.logoUrl)} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>



                  {/* Platform text overlay */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/40 text-white/80 backdrop-blur-sm z-10">
                    {executor.platforms?.join(", ") || "All"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1 gap-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-offgray-100 leading-snug truncate group-hover:text-white transition-colors duration-100">
                        {executor.name}
                      </h3>
                      <span
                        className={[
                          "text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ml-2 shrink-0",
                          executor.priceModel === "Paid"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : executor.priceModel === "Keyless"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        ].join(" ")}
                      >
                        {executor.priceModel}
                      </span>
                    </div>
                    <div className="text-[10px] text-offgray-600 mt-1 mb-1 font-mono tracking-tight">
                      Updated {formatDistanceToNow(new Date(executor.updatedAt), { addSuffix: true })}
                    </div>
                    <p className="text-[11px] text-offgray-500 leading-relaxed line-clamp-2">
                      {executor.description || "No description provided."}
                    </p>
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    {executor.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-offgray-500 border border-white/[0.06] truncate max-w-[80px]"
                      >
                        {tag}
                      </span>
                    ))}
                    {(executor.tags?.length || 0) > 2 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.02] text-offgray-600 border border-white/[0.04]">
                        +{(executor.tags?.length || 0) - 2}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
