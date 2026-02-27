export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    let d = new Date(date);

    // If string and likely UTC but missing Z/Offset (common with SQL dates in API)
    // We assume server always sends UTC.
    if (typeof date === 'string' && !date.endsWith('Z') && !date.includes('+') && !date.includes('-')) {
        // Replace space with T just in case, and append Z
        // Try-catch or valid check?
        const utcDate = new Date(date.replace(' ', 'T') + 'Z');
        if (!isNaN(utcDate.getTime())) {
            d = utcDate;
        }
    }
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays}d`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}mo`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y`;
}
