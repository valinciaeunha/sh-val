interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="flex flex-col items-center text-center p-6 bg-surface-panel border border-border-subtle rounded-lg space-y-3">
            <div className="text-emerald-400">{icon}</div>
            <h3 className="text-sm font-medium text-offgray-50">{title}</h3>
            <p className="text-xs text-offgray-500 leading-relaxed">{description}</p>
        </div>
    );
}
