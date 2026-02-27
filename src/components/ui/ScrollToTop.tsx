"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Generates a jagged lightning bolt path between two points.
 * Each bolt is unique due to random offsets.
 */
function generateBolt(
    x1: number, y1: number,
    x2: number, y2: number,
    segments = 6
): string {
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    let path = `M${x1},${y1}`;
    for (let i = 1; i < segments; i++) {
        const jitterX = (Math.random() - 0.5) * 14;
        const jitterY = (Math.random() - 0.5) * 8;
        path += ` L${x1 + dx * i + jitterX},${y1 + dy * i + jitterY}`;
    }
    path += ` L${x2},${y2}`;
    return path;
}

/** Pre-defined arc start/end positions around the circle (in a 44x44 viewBox) */
const ARC_CONFIGS = [
    { x1: 4, y1: 22, x2: 18, y2: 8 },     // left → top
    { x1: 40, y1: 22, x2: 26, y2: 8 },     // right → top
    { x1: 8, y1: 36, x2: 22, y2: 18 },     // bottom-left → center
    { x1: 36, y1: 36, x2: 22, y2: 18 },    // bottom-right → center
    { x1: 12, y1: 6, x2: 32, y2: 6 },      // top arc
    { x1: 6, y1: 14, x2: 22, y2: 26 },     // top-left → center-bottom
    { x1: 38, y1: 14, x2: 22, y2: 26 },    // top-right → center-bottom
];

interface Arc {
    id: number;
    path: string;
    opacity: number;
    width: number;
    glow: boolean;
}

export default function ScrollToTop() {
    const [show, setShow] = useState(false);
    const [arcs, setArcs] = useState<Arc[]>([]);
    const [hovered, setHovered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const arcIdRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        const handler = () => setShow(window.scrollY > 200);
        handler();
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    // ... (rest of code before return)

    const spawnArc = useCallback(() => {
        const config = ARC_CONFIGS[Math.floor(Math.random() * ARC_CONFIGS.length)];
        const id = arcIdRef.current++;
        const arc: Arc = {
            id,
            path: generateBolt(config.x1, config.y1, config.x2, config.y2, 4 + Math.floor(Math.random() * 4)),
            opacity: 0.5 + Math.random() * 0.5,
            width: 0.8 + Math.random() * 1.2,
            glow: Math.random() > 0.5,
        };
        setArcs(prev => [...prev.slice(-4), arc]); // keep max 5 arcs
        // Remove after flicker
        setTimeout(() => setArcs(prev => prev.filter(a => a.id !== id)), 80 + Math.random() * 120);
    }, []);

    useEffect(() => {
        if (!show) return;
        // Ambient arcs: one every ~800ms (faster on hover)
        const rate = hovered ? 150 : 800;
        intervalRef.current = setInterval(spawnArc, rate);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [show, hovered, spawnArc]);

    if (!mounted) return null;

    return (
        <>
            <style jsx global>{`
                @keyframes stt-entrance {
                    0% { opacity: 0; transform: translateY(24px) scale(0.6); }
                    60% { opacity: 1; transform: translateY(-4px) scale(1.05); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes stt-arc-flash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    30% { opacity: 0.3; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-label="Scroll to top"
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 99999,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: hovered
                        ? "radial-gradient(circle at 50% 40%, #0f2922 0%, #0a0f14 70%)"
                        : "radial-gradient(circle at 50% 40%, #111820 0%, #0a0e13 70%)",
                    border: `1px solid ${hovered ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.15)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: hovered
                        ? "0 0 24px rgba(16, 185, 129, 0.25), 0 0 60px rgba(16, 185, 129, 0.08), 0 8px 32px rgba(0,0,0,0.6)"
                        : "0 0 12px rgba(16, 185, 129, 0.08), 0 4px 20px rgba(0,0,0,0.5)",
                    opacity: show ? 1 : 0,
                    pointerEvents: show ? "auto" : "none",
                    animation: show ? "stt-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
                    transition: "border 0.2s, box-shadow 0.3s, background 0.3s",
                    overflow: "visible",
                }}
            >
                {/* Lightning arcs SVG overlay */}
                <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        overflow: "visible",
                    }}
                >
                    {arcs.map((arc) => (
                        <g key={arc.id}>
                            {/* Glow layer */}
                            {arc.glow && (
                                <path
                                    d={arc.path}
                                    fill="none"
                                    stroke="rgba(16, 185, 129, 0.3)"
                                    strokeWidth={arc.width + 3}
                                    strokeLinecap="round"
                                    style={{
                                        animation: "stt-arc-flash 0.15s linear forwards",
                                        filter: "blur(3px)",
                                    }}
                                />
                            )}
                            {/* Core bolt */}
                            <path
                                d={arc.path}
                                fill="none"
                                stroke="#10B981"
                                strokeWidth={arc.width}
                                strokeLinecap="round"
                                style={{
                                    animation: "stt-arc-flash 0.15s linear forwards",
                                    opacity: arc.opacity,
                                }}
                            />
                        </g>
                    ))}
                </svg>

                {/* Arrow icon */}
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={hovered ? "#34D399" : "#10B981"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        position: "relative",
                        zIndex: 2,
                        transition: "stroke 0.2s",
                        filter: hovered ? "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))" : "none",
                    }}
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
        </>
    );
}
