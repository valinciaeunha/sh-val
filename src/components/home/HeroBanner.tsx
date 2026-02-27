export function HeroBanner() {
    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-panel">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[radial-gradient(ellipse_at_center,_rgba(100,160,255,0.08)_0%,_transparent_70%)] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 md:py-24">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-offgray-400 bg-offgray-900/60 border border-border-subtle rounded-full px-3 py-1 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Platform Active
                </div>

                {/* Headline */}
                <h1 className="heading-base text-3xl md:text-4xl lg:text-[42px] max-w-2xl leading-tight">
                    Discover & Deploy
                    <br />
                    <span className="text-offgray-400">Premium Scripts</span>
                </h1>

                {/* Sub */}
                <p className="mt-4 text-sm md:text-base text-offgray-500 max-w-md leading-relaxed">
                    Browse verified scripts, trusted executors, and curated hubs — all in one place.
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-8 mt-10 pt-6 border-t border-border-subtle">
                    <div className="text-center">
                        <div className="text-lg font-medium text-offgray-50 font-mono tabular-nums">2.4K+</div>
                        <div className="text-[11px] text-offgray-600 mt-0.5">Scripts</div>
                    </div>
                    <div className="w-px h-8 bg-border-subtle" />
                    <div className="text-center">
                        <div className="text-lg font-medium text-offgray-50 font-mono tabular-nums">180+</div>
                        <div className="text-[11px] text-offgray-600 mt-0.5">Executors</div>
                    </div>
                    <div className="w-px h-8 bg-border-subtle" />
                    <div className="text-center">
                        <div className="text-lg font-medium text-offgray-50 font-mono tabular-nums">48K+</div>
                        <div className="text-[11px] text-offgray-600 mt-0.5">Downloads</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
