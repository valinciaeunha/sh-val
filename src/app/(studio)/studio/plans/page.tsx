"use client";

import { useState, useEffect } from "react";
import { plansApi, PlanWithMaximums } from "@/lib/api/plans";

export default function PlansPage() {
    const [data, setData] = useState<PlanWithMaximums | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update time every minute for the countdown
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await plansApi.getMyPlan();
                setData(res);
            } catch (err) {
                // error silently handled
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    const currentPlanType = data?.plan.plan_type || "free";

    const getCountdown = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now.getTime();
        if (diff <= 0) return "Expired";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "$0",
            period: "/month",
            description: "Essential tools for hobbyists",
            features: [
                "Deployments (3/mo)",
                "Key System (Timed only)",
                "HWID Lock (1 device/key)",
                "Public Profile",
                "Basic Analytics",
                "Community Support",
            ],
            cta: "Current Plan",
            disabled: true,
            highlight: false
        },
        {
            id: "pro",
            name: "Pro",
            price: "$9",
            period: "/month",
            description: "Power tools for serious developers",
            features: [
                "Everything in Free",
                "Deployments (100/mo)",
                "Key System (5,000/mo)",
                "Obfuscation (50/mo)",
                "HWID Lock (2 devices/key)",
                "Advanced Analytics",
                "Priority Support",
            ],
            cta: "Coming Soon",
            disabled: true,
            highlight: true
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price: "$29",
            period: "/month",
            description: "Scale your operation",
            features: [
                "Everything in Pro",
                "Deployments (10,000/mo)",
                "Key System (50,000/mo)",
                "Obfuscation (50,000/mo)",
                "HWID Lock (10 devices/key)",
                "Team Management",
                "API Access",
                "Dedicated Support",
            ],
            cta: "Coming Soon",
            disabled: true,
            highlight: false
        },
        {
            id: "custom",
            name: "Custom",
            price: "Custom",
            period: "/month",
            description: "Tailored to your needs",
            features: [
                "Everything in Enterprise",
                "Lifetime Keys",
                "HWID Lock (50 devices/key)",
                "Custom Resource Limits",
                "Custom Expiry Dates",
                "Dedicated Account Manager",
                "SLA Guarantee",
                "Priority API Access",
            ],
            cta: "Contact Admin",
            disabled: true,
            highlight: false
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-serif tracking-tight text-offgray-50">Subscription Plans</h1>
                <p className="text-sm font-mono text-offgray-500">Upgrade your studio to unlock more features and monetization tools.</p>
            </div>

            {/* Credits Dashboard */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Maximum Keys</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-serif text-white">{data.maximums.maximum_keys.toLocaleString()}</span>
                            <span className="text-[10px] font-mono text-offgray-600">limit (concurrent)</span>
                        </div>
                    </div>
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Maximum Obfuscation</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-serif text-white">{data.maximums.maximum_obfuscation.toLocaleString()}</span>
                            <span className="text-[10px] font-mono text-offgray-600">remaining</span>
                        </div>
                    </div>
                    <div className="bg-[#0a0c10] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mb-1">Maximum Deployments</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-serif text-white">{data.maximums.maximum_deployments.toLocaleString()}</span>
                            <span className="text-[10px] font-mono text-offgray-600">remaining</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((plan) => {
                    const isCurrent = currentPlanType === plan.id;
                    return (
                        <div
                            key={plan.name}
                            className={`relative rounded-xl p-8 flex flex-col h-full bg-[#0a0c10] border transition-all ${isCurrent
                                ? plan.id === "custom"
                                    ? "border-rose-500/30 bg-rose-500/[0.02] shadow-lg shadow-rose-500/5 ring-1 ring-rose-500/10"
                                    : "border-emerald-500/30 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/10"
                                : plan.highlight
                                    ? "border-white/[0.08] bg-white/[0.01]"
                                    : "border-white/[0.04] hover:border-white/[0.08]"
                                }`}
                        >
                            {isCurrent && (
                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border text-[10px] font-mono tracking-widest uppercase backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap ${plan.id === "custom" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                                    Current Plan
                                    {plan.id !== 'free' && data?.plan.expires_at && (
                                        <span className={getCountdown(data.plan.expires_at) === "Expired" ? "text-rose-400" : "text-emerald-500/80"}>
                                            • {getCountdown(data.plan.expires_at) === "Expired" ? "Expired" : `Expires in ${getCountdown(data.plan.expires_at)}`}
                                        </span>
                                    )}
                                </div>
                            )}

                            {plan.highlight && !isCurrent && (
                                <div className="absolute top-0 right-0 p-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-white/5 text-white/50 border border-white/10">
                                        RECOMMENDED
                                    </span>
                                </div>
                            )}

                            <div className="mb-6 pr-8 mt-2">
                                <h3 className="text-lg font-serif tracking-tight text-offgray-50">{plan.name}</h3>
                                <p className="text-[11px] font-mono uppercase tracking-widest text-offgray-500 mt-1.5">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-serif tracking-tight text-offgray-50">{plan.price}</span>
                                <span className="text-[10px] font-mono tracking-widest uppercase text-offgray-500 ml-2">{plan.period}</span>
                            </div>

                            <div className="w-full h-px bg-white/[0.04] mb-6" />

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-xs text-offgray-400">
                                        <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? plan.id === "custom" ? "text-rose-400" : "text-emerald-400" : "text-offgray-600"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span className="leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={plan.disabled || isCurrent}
                                className={`w-full h-11 rounded-md text-[10px] font-mono uppercase tracking-widest transition-all ${isCurrent
                                    ? plan.id === "custom"
                                        ? "bg-rose-500/10 text-rose-400 cursor-default border border-rose-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20"
                                    : plan.disabled
                                        ? "bg-white/[0.02] text-offgray-600 cursor-not-allowed border border-white/[0.04]"
                                        : plan.highlight
                                            ? "bg-white hover:bg-offgray-100 text-black shadow-lg shadow-white/10 border border-transparent"
                                            : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-offgray-200"
                                    }`}
                            >
                                {isCurrent ? "Active" : plan.cta}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="border border-amber-500/20 bg-amber-500/[0.02] rounded-xl p-4 flex gap-3 text-sm text-amber-500/80">
                <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-amber-500">Monetization Beta</p>
                    <p className="text-xs text-offgray-400 leading-relaxed">
                        We are actively developing our payment infrastructure. Subscription plans will be available soon.
                    </p>
                </div>
            </div>
        </div>
    );
}
