import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") || "";
    const pathname = request.nextUrl.pathname;

    // Handle getkey.scripthub.id subdomain
    if (hostname.startsWith("getkey.")) {
        // Skip Next.js internal paths and static files
        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api") ||
            pathname.includes(".") // static files (favicon, etc.)
        ) {
            return NextResponse.next();
        }

        // Rewrite getkey.scripthub.id/ → /getkey
        // Rewrite getkey.scripthub.id/some-slug → /getkey/some-slug
        const rewritePath = pathname === "/" ? "/getkey" : `/getkey${pathname}`;

        const url = request.nextUrl.clone();
        url.pathname = rewritePath;

        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
