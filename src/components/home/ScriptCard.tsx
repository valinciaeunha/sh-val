"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getStorageUrl } from "@/lib/utils/image";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { scriptsApi } from "@/lib/api/scripts";
/** 
 * Fractal Lightning Generator
 * Uses recursive midpoint displacement for realistic jagged bolts.
 */
function createFractalBolt(x1: number, y1: number, x2: number, y2: number, roughness: number, depth: number): string[] {
  const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];

  // Recursively add midpoints with random displacement
  for (let i = 0; i < depth; i++) {
    for (let j = points.length - 2; j >= 0; j--) {
      const p1 = points[j];
      const p2 = points[j + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Calculate normal vector for perpendicular displacement
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;

      // The displacement reduces as we go deeper
      const displacement = (Math.random() - 0.5) * roughness * (len * 0.4);

      points.splice(j + 1, 0, {
        x: midX + nx * displacement,
        y: midY + ny * displacement
      });
    }
  }

  // Generate SVG path string from points
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
  }

  // Generate 1-2 small branch paths off the main bolt
  const branches = [];
  if (Math.random() > 0.4 && points.length > 4) {
    const branchIndex = Math.floor(points.length * (0.3 + Math.random() * 0.5));
    const bp = points[branchIndex];
    if (bp) {
      const bdx = (Math.random() - 0.5) * 40;
      const bdy = (Math.random() - 0.5) * 40;
      // create a very short simple branch
      branches.push(`M${bp.x.toFixed(1)},${bp.y.toFixed(1)} L${(bp.x + bdx).toFixed(1)},${(bp.y + bdy).toFixed(1)} L${(bp.x + bdx * 1.5 + (Math.random() - 0.5) * 10).toFixed(1)},${(bp.y + bdy * 1.5 + (Math.random() - 0.5) * 10).toFixed(1)}`);
    }
  }

  return [path, ...branches];
}

function CardLightning({ active, w, h }: { active: boolean; w: number; h: number }) {
  const [strikes, setStrikes] = useState<{ id: number; paths: string[]; opacity: number; width: number }[]>([]);
  const idRef = useRef(0);

  const spawn = useCallback(() => {
    if (!active || w === 0 || h === 0) return;
    const r = () => Math.random();

    // Pick start and end points
    let x1, y1, x2, y2;
    const edgePattern = Math.floor(r() * 5);

    if (edgePattern === 0) { // Top edge to middle
      x1 = r() * w; y1 = -10;
      x2 = r() * w; y2 = h * (0.2 + r() * 0.5);
    } else if (edgePattern === 1) { // Left edge to middle
      x1 = -10; y1 = r() * h;
      x2 = w * (0.2 + r() * 0.5); y2 = r() * h;
    } else if (edgePattern === 2) { // Right edge to middle
      x1 = w + 10; y1 = r() * h;
      x2 = w * (0.5 + r() * 0.3); y2 = r() * h;
    } else if (edgePattern === 3) { // Corner to diagonal
      x1 = r() > 0.5 ? -10 : w + 10;
      y1 = r() > 0.5 ? -10 : h + 10;
      x2 = w * (0.2 + r() * 0.6);
      y2 = h * (0.2 + r() * 0.6);
    } else { // Interior spark
      const cx = w * r(); const cy = h * r();
      x1 = cx - 20 + r() * 40; y1 = cy - 20 + r() * 40;
      x2 = cx - 20 + r() * 40; y2 = cy - 20 + r() * 40;
    }

    // Depth 3 = 8 segments (fairly detailed for small card)
    const paths = createFractalBolt(x1, y1, x2, y2, 0.8, 3);

    const id = idRef.current++;
    const strike = {
      id,
      paths,
      opacity: 0.6 + r() * 0.4,
      width: 0.8 + r() * 0.8
    };

    setStrikes(p => [...p.slice(-2), strike]); // Max 3 strikes visible

    // Sharp flash and fast fade (lightning is quick)
    setTimeout(() => {
      setStrikes(p => p.map(s => s.id === id ? { ...s, opacity: s.opacity * 0.3 } : s));
    }, 40 + r() * 30);

    setTimeout(() => {
      setStrikes(p => p.filter(a => a.id !== id));
    }, 120 + r() * 100);

  }, [active, w, h]);

  useEffect(() => {
    if (!active) { setStrikes([]); return; }

    // Varying intervals feel more organic than a fixed setInterval
    let timeout: NodeJS.Timeout;
    const loop = () => {
      spawn();
      // Double strike chance
      if (Math.random() > 0.7) {
        setTimeout(spawn, 50 + Math.random() * 50);
      }
      timeout = setTimeout(loop, 200 + Math.random() * 600);
    };
    loop();
    return () => clearTimeout(timeout);
  }, [active, spawn]);

  if (!active || strikes.length === 0) return null;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}>

      {/* Background flash overlay when lightning strikes */}
      <rect width="100%" height="100%" fill="rgba(16, 185, 129, 0.05)" opacity={Math.max(...strikes.map(s => s.opacity))} />

      {strikes.map(strike => (
        <g key={strike.id} style={{ transition: 'opacity 0.1s linear' }} opacity={strike.opacity}>
          {strike.paths.map((path, i) => (
            <g key={i}>
              {/* Wide blur */}
              <path d={path} fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth={strike.width + 5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(4px)' }} />
              {/* Core glow */}
              <path d={path} fill="none" stroke="#10B981" strokeWidth={strike.width + 1} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(1px)' }} />
              {/* Intense white-hot core */}
              <path d={path} fill="none" stroke={i === 0 ? "rgba(230, 255, 245, 0.9)" : "#34D399"} strokeWidth={strike.width * 0.6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

interface ScriptCardProps {
  id?: string;
  title: string;
  game: string;
  stars: number;
  timeAgo: string;
  tag?: string;
  href: string;
  color: string;
  thumbnailUrl?: string;
  gameLogoUrl?: string;
  fallbackType?: "pattern" | "icon";
  statType?: "stars" | "views";
  gameSlug?: string;
  isLiked?: boolean;
  isPaid?: boolean;
  hasKeySystem?: boolean;
}

export function ScriptCard({
  id,
  title,
  game,
  stars,
  timeAgo,
  tag,
  href,
  color,
  thumbnailUrl,
  gameLogoUrl,
  fallbackType = "pattern",
  statType = "stars",
  gameSlug,
  isLiked: initialIsLiked = false,
  isPaid = false,
  hasKeySystem = false,
}: ScriptCardProps) {
  const [imgError, setImgError] = useState(false);
  const { openAuthModal } = useAuth();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(stars);
  const [hovered, setHovered] = useState(false);
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });
  const cardRef = useRef<HTMLDivElement>(null); // Using stars as initial count if needed, or strictly visual

  // Reset error state when url changes
  useEffect(() => {
    setImgError(false);
  }, [thumbnailUrl]);

  // Sync local liked state if prop changes
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  const showImage = ((!imgError && thumbnailUrl) || (!imgError && gameLogoUrl));
  // Prioritize thumbnail until it errors, then game logo
  const displayUrl = thumbnailUrl ? thumbnailUrl : gameLogoUrl;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal('login');
      return;
    }

    // Optimistic toggle
    const prevIsLiked = isLiked;
    setIsLiked(!isLiked);

    if (id) {
      try {
        await scriptsApi.toggleLike(id);
      } catch (error) {
        // error silently handled
        setIsLiked(prevIsLiked); // Revert
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col w-full bg-surface-panel border border-border-subtle rounded-xl hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 select-none"
      onMouseEnter={() => {
        setHovered(true);
        if (cardRef.current) {
          const r = cardRef.current.getBoundingClientRect();
          setCardSize({ w: r.width, h: r.height });
        }
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <CardLightning active={hovered} w={cardSize.w} h={cardSize.h} />
      {/* Main Link (Stretched) */}
      <Link href={href} className="absolute inset-0 z-0" aria-label={`View ${title}`} />

      {/* Thumbnail — clean */}
      <div className="relative w-full aspect-video overflow-hidden rounded-t-xl bg-surface-ground group/thumb">
        {displayUrl && !imgError ? (
          <>
            <img
              src={getStorageUrl(displayUrl)}
              alt={title}
              className={`absolute w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imgError ? 'opacity-0' : 'opacity-100'}`}
              style={{ color: 'transparent' }} // Hides the browser's default broken image icon
              onError={() => setImgError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
          </>
        ) : fallbackType === "icon" ? (
          <div className="w-full h-full flex items-center justify-center bg-surface-panel text-offgray-700">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
          </div>
        ) : (
          <div
            className="w-full h-full relative"
            style={{ backgroundColor: color }}
          >
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id={`g-${title.replace(/\s/g, "")}`}
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
                  fill={`url(#g-${title.replace(/\s/g, "")})`}
                />
              </svg>
            </div>
          </div>
        )}

        {/* Like Button Overlay */}
        <button
          onClick={handleLike}
          className={`absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 ${isLiked
            ? "bg-pink-500/10 text-pink-500 opacity-100"
            : "bg-black/40 text-white hover:bg-black/60"
            }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.28 3.6-2.33 3.6-5.45C22.6 4.98 19.5 2 15.5 2 13 2 12.33 3.5 12 4.5 11.67 3.5 11 2 8.5 2 4.5 2 1.4 4.98 1.4 8.55c0 3.12 2.11 4.17 3.6 5.45L12 21l7-7z" />
          </svg>
        </button>

        {/* Badges row */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10">
          {tag && (
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider rounded px-2 py-0.5">
              {tag}
            </div>
          )}
          {isPaid && (
            <div className="bg-amber-500/90 backdrop-blur-sm text-[10px] font-bold text-black rounded px-1.5 py-0.5 flex items-center gap-0.5" title="Paid Script">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Paid
            </div>
          )}
          {hasKeySystem && (
            <div className="bg-cyan-500/90 backdrop-blur-sm text-[10px] font-bold text-black rounded px-1.5 py-0.5 flex items-center gap-0.5" title="Key System">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              Key
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5 relative z-10 pointer-events-none">
        {gameSlug ? (
          <Link
            href={`/g/${gameSlug}`}
            className="text-[11px] text-emerald-400 truncate hover:text-emerald-300 transition-colors inline-block max-w-full pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {game}
          </Link>
        ) : (
          <p className="text-[11px] text-emerald-400 truncate">{game}</p>
        )}
        <h3 className="text-sm font-medium text-offgray-100 leading-snug truncate group-hover:text-white transition-colors duration-100">
          {title}
        </h3>
        <div className="flex items-center justify-between pt-1 text-[11px] text-offgray-600">
          <span className="flex items-center gap-1">
            {statType === "stars" ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            {stars.toLocaleString()}
          </span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
