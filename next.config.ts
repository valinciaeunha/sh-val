import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "s3.nevaobjects.id",
      },
      {
        protocol: "https",
        hostname: "*.rbxcdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "cdn.scripthub.id",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/monaco/vs/:path*",
        destination: "/node_modules/monaco-editor/min/vs/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.adsterra.com https://*.adstera.com https://*.adsterratech.com https://*.profitabledisplaynetwork.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.scripthub.id https://cdn.scripthub.id https://challenges.cloudflare.com https://*.adsterra.com",
              "frame-src 'self' https://challenges.cloudflare.com https://*.adsterra.com https://*.profitabledisplaynetwork.com",
              "worker-src 'self' blob:",
            ].join('; ')
          }
        ],
      },
    ];
  },
};

export default nextConfig;
