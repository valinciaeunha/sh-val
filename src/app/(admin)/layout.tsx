import { AdminHeader } from "@/components/layout/AdminHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin — scripthub.id",
    description: "Admin panel for scripthub.id",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-surface-root text-offgray-300">
            <AdminHeader />
            <main className="w-full max-w-[1148px] mx-auto px-4 md:px-6 py-6 md:py-8">
                {children}
            </main>
        </div>
    );
}
