export default function StudioLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-3">
                <div className="h-7 w-40 bg-white/[0.04] rounded-md" />
                <div className="h-4 w-72 bg-white/[0.03] rounded-md" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl bg-surface-panel border border-white/[0.06] p-5 space-y-3"
                    >
                        <div className="h-5 w-2/3 bg-white/[0.04] rounded" />
                        <div className="h-3 w-full bg-white/[0.03] rounded" />
                        <div className="h-3 w-4/5 bg-white/[0.03] rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
