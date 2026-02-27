import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ScriptHub — The script ecosystem for Roblox builders",
    template: "%s | ScriptHub",
  },
  description: "Discover, share, and monetize Lua scripts with purpose-built infrastructure — key systems, CDN deployments, and community hubs.",
  keywords: ["roblox scripts", "lua scripts", "script hosting", "script hub", "roblox exploits", "executor scripts", "lua key system", "script cdn"],
  authors: [{ name: "ScriptHub" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scripthub.id",
    title: "ScriptHub — The script ecosystem for Roblox builders",
    description: "The premier platform for Roblox script developers. Publish, distribute, and monetize Lua scripts with built-in CDN, key systems, and analytics.",
    siteName: "ScriptHub",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "ScriptHub Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScriptHub — The script ecosystem for Roblox builders",
    description: "Publish, distribute, and monetize your Roblox scripts.",
    images: ["/og-default.png"],
  },
  metadataBase: new URL("https://scripthub.id"),
  themeColor: "#10b981", // emerald-500
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-sm`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
