"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Generate a jagged lightning bolt path between two points
 */
function makeBolt(
    x1: number, y1: number,
    x2: number, y2: number,
    segments = 8
): string {
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    let d = `M${x1.toFixed(1)},${y1.toFixed(1)}`;

    for (let i = 1; i < segments; i++) {
        const jx = (Math.random() - 0.5) * 60;
        const jy = (Math.random() - 0.5) * 20;
        d += ` L${(x1 + dx * i + jx).toFixed(1)},${(y1 + dy * i + jy).toFixed(1)}`;
    }
    d += ` L${x2.toFixed(1)},${y2.toFixed(1)}`;
    return d;
}

/** Create a bolt with 1-2 branches */
function makeBoltWithBranches(
    x1: number, y1: number,
    x2: number, y2: number
): string[] {
    const main = makeBolt(x1, y1, x2, y2, 6 + Math.floor(Math.random() * 5));
    const paths = [main];

    // Add 1-3 branch bolts splitting off from random points along the main path
    const branchCount = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < branchCount; b++) {
        const t = 0.2 + Math.random() * 0.6; // split point along main
        const bx1 = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
        const by1 = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10;
        const bx2 = bx1 + (Math.random() - 0.5) * 120;
        const by2 = by1 + 30 + Math.random() * 60;
        paths.push(makeBolt(bx1, by1, bx2, by2, 3 + Math.floor(Math.random() * 3)));
    }
    return paths;
}

interface LightningStrike {
    id: number;
    paths: string[];
    x: number; // horizontal position (%)
    opacity: number;
}

export default function AmbientLightning() {
    const [strikes, setStrikes] = useState<LightningStrike[]>([]);
    const idRef = useRef(0);

    const spawn = useCallback(() => {
        const id = idRef.current++;
        const x = 10 + Math.random() * 80; // 10%-90% horizontal
        const startX = (x / 100) * 1200;
        const endX = startX + (Math.random() - 0.5) * 200;
        const paths = makeBoltWithBranches(startX, -10, endX, 200 + Math.random() * 150);

        const strike: LightningStrike = {
            id,
            paths,
            x: 0,
            opacity: 0.15 + Math.random() * 0.25,
        };

        setStrikes(prev => [...prev.slice(-2), strike]);

        // Flash: remove after short flicker
        setTimeout(() => setStrikes(prev => prev.filter(s => s.id !== id)), 150 + Math.random() * 200);
    }, []);

    useEffect(() => {
        // Random interval between 3-8 seconds
        let timeout: NodeJS.Timeout;

        const scheduleNext = () => {
            const delay = 3000 + Math.random() * 5000;
            timeout = setTimeout(() => {
                spawn();
                // Sometimes double-strike
                if (Math.random() > 0.6) {
                    setTimeout(spawn, 60 + Math.random() * 100);
                }
                scheduleNext();
            }, delay);
        };

        scheduleNext();
        return () => clearTimeout(timeout);
    }, [spawn]);

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100%",
                maxHeight: 500,
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: 1,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1200 400"
                preserveAspectRatio="xMidYMin slice"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            >
                {strikes.map((strike) =>
                    strike.paths.map((path, i) => (
                        <g key={`${strike.id}-${i}`}>
                            {/* Wide glow */}
                            <path
                                d={path}
                                fill="none"
                                stroke="rgba(16, 185, 129, 0.15)"
                                strokeWidth={i === 0 ? 8 : 4}
                                strokeLinecap="round"
                                style={{ filter: "blur(6px)" }}
                                opacity={strike.opacity}
                            />
                            {/* Medium glow */}
                            <path
                                d={path}
                                fill="none"
                                stroke="rgba(16, 185, 129, 0.3)"
                                strokeWidth={i === 0 ? 3 : 1.5}
                                strokeLinecap="round"
                                style={{ filter: "blur(2px)" }}
                                opacity={strike.opacity}
                            />
                            {/* Core bolt */}
                            <path
                                d={path}
                                fill="none"
                                stroke={i === 0 ? "rgba(180, 255, 220, 0.9)" : "rgba(16, 185, 129, 0.7)"}
                                strokeWidth={i === 0 ? 1.5 : 0.8}
                                strokeLinecap="round"
                                opacity={strike.opacity * 1.5}
                            />
                        </g>
                    ))
                )}
            </svg>

            {/* Flash overlay on strike */}
            {strikes.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
                        animation: "stt-page-flash 0.2s ease-out forwards",
                    }}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes stt-page-flash {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}} />
        </div>
    );
}
