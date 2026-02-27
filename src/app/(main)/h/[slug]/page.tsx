import { Suspense } from 'react';
import type { Metadata } from 'next';
import HubClientPage from './HubClientPage';
import { getStorageUrl } from '@/lib/utils/image';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) return {};

    // Use direct fetch for SSR to avoid Axios interceptor/cookie issues on the server
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.scripthub.id/api';
    const res = await fetch(`${baseUrl}/hubs/slug/${slug}`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) return {};

    const data = await res.json();
    const hub = data.data;

    if (!hub) return {};

    const title = `${hub.name} | ScriptHub`;
    const description = (hub.description && hub.description.trim())
      ? hub.description.substring(0, 160)
      : `Explore ${hub.name} on ScriptHub - The script ecosystem for Roblox builders.`;

    // Prefer banner first, otherwise logo, otherwise default image
    const imageUrl = hub.banner_url || hub.bannerUrl || hub.logo_url || hub.logoUrl;
    const finalImageUrl = imageUrl ? getStorageUrl(imageUrl) : "https://scripthub.id/og-default.png";

    // Ensure absolute URL
    const absoluteImageUrl = finalImageUrl.startsWith('http') ? finalImageUrl : `https://scripthub.id${finalImageUrl}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://scripthub.id/h/${slug}`,
        type: 'website',
        images: [absoluteImageUrl],
        siteName: 'ScriptHub',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [absoluteImageUrl],
      },
    };
  } catch (e) {
    console.error('[OG Hub Metadata Error]', e);
    return {};
  }
}

export default function HubPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>}>
      <HubClientPage />
    </Suspense>
  );
}
