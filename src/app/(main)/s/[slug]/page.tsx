import { Suspense } from 'react';
import type { Metadata } from 'next';
import ScriptClientPage from './ScriptClientPage';
import { getStorageUrl } from '@/lib/utils/image';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        const { slug } = await params;
        if (!slug) return {};

        // Use direct fetch for SSR to avoid Axios interceptor/cookie issues on the server
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.scripthub.id/api';
        const res = await fetch(`${baseUrl}/scripts/slug/${slug}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) return {};

        const data = await res.json();
        const script = data.data;

        if (!script) return {};

        const title = `${script.title} | ScriptHub`;
        const description = script.description
            ? script.description.substring(0, 160)
            : `Get ${script.title} by ${script.ownerUsername || script.owner_username} on ScriptHub - The script ecosystem for Roblox builders.`;

        const thumbnailUrl = script.thumbnailUrl || script.thumbnail_url;
        const imageUrl = thumbnailUrl ? getStorageUrl(thumbnailUrl) : "https://scripthub.id/og-default.png";

        // Ensure absolute URL
        const finalImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://scripthub.id${imageUrl}`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url: `https://scripthub.id/s/${slug}`,
                type: 'website',
                images: [finalImageUrl],
                siteName: 'ScriptHub',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [finalImageUrl],
            },
        };
    } catch (e) {
        return {};
    }
}

export default function ScriptPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>}>
            <ScriptClientPage />
        </Suspense>
    );
}
