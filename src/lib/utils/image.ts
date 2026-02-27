
const S3_ENDPOINT = process.env.NEXT_PUBLIC_S3_ENDPOINT;
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;

/**
 * Get full storage URL for an image path
 * Handles both relative paths (stored in DB) and full URLs (legacy)
 */
export const getStorageUrl = (path: string | null | undefined): string => {
    if (!path) return "/placeholder-image.png"; // Replace with your default image

    if (path.startsWith("http")) {
        return path;
    }

    // Clean path to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // If using a custom CDN domain (like cdn.scripthub.id), the bucket name isn't needed in the path
    if (S3_ENDPOINT?.includes(S3_BUCKET || '')) {
        return `${S3_ENDPOINT}/${cleanPath}`;
    }

    return `${S3_ENDPOINT}/${S3_BUCKET}/${cleanPath}`;
};
