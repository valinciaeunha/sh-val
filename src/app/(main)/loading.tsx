export default function MainLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-3">
                <div className="h-7 w-48 bg-white/[0.04] rounded-md" />
                <div className="h-4 w-80 bg-white/[0.03] rounded-md" />
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl bg-surface-panel border border-white/[0.06] overflow-hidden"
                    >
                        <div className="aspect-[16/9] bg-white/[0.03]" />
                        <div className="p-4 space-y-3">
                            <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                            <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
