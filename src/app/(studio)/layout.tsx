import { StudioHeader } from "@/components/layout/StudioHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Studio — scripthub.id",
    description: "Manage your scripts, hubs, and settings on ScriptHub.id",
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-surface-root text-offgray-300">
            <StudioHeader />
            <main className="w-full max-w-[1148px] mx-auto px-4 md:px-6 py-6 md:py-8">
                {children}
            </main>
        </div>
    );
}

