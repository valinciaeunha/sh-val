"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface FallbackImageProps extends Omit<ImageProps, "onError"> {
    /** Type of placeholder icon to show on error */
    iconType?: "photo" | "game" | "user" | "file";
    /** Custom fallback element (overrides iconType) */
    fallback?: React.ReactNode;
}

const icons = {
    photo: (
        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    game: (
        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 12h4" />
            <path d="M8 10v4" />
            <circle cx="15" cy="11" r="1" />
            <circle cx="18" cy="13" r="1" />
        </svg>
    ),
    user: (
        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    file: (
        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
};

export default function FallbackImage({
    iconType = "photo",
    fallback,
    className,
    alt,
    ...props
}: FallbackImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-ground">
                {fallback || icons[iconType]}
            </div>
        );
    }

    return (
        <Image
            {...props}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}
