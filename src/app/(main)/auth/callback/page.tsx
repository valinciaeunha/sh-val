"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const accessToken = searchParams.get("token");
        const refreshToken = searchParams.get("refresh");
        const error = searchParams.get("error");

        // Check for errors
        if (error) {
          setStatus("error");
          setMessage(
            error === "auth_failed"
              ? "Authentication failed. Please try again."
              : "An error occurred during authentication.",
          );
          setTimeout(() => {
            router.push("/home");
          }, 3000);
          return;
        }

        // Check if tokens are present
        if (!accessToken || !refreshToken) {
          setStatus("error");
          setMessage("Invalid authentication response.");
          setTimeout(() => {
            router.push("/home");
          }, 3000);
          return;
        }

        // Store tokens
        authApi.handleOAuthCallback(accessToken, refreshToken);

        // Fetch user data
        await authApi.getCurrentUser();

        // Dispatch auth-change event to update headers and hooks immediately
        window.dispatchEvent(new Event('auth-change'));

        // Success
        setStatus("success");
        setMessage("Login successful! Redirecting...");

        // Redirect to home via window.location for full hydration reset
        setTimeout(() => {
          window.location.href = "/home";
        }, 1500);
      } catch (error) {
        // error silently handled
        setStatus("error");
        setMessage("Failed to complete authentication.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10]">
      {/* Subtle Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" style={{ backgroundSize: '30px 30px' }} />
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center space-y-6 p-8 bg-[#11141A] border border-white/[0.04] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">

        {/* Loading Spinner */}
        {status === "loading" && (
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 border-2 border-[#10B981]/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-[#10B981] rounded-full animate-spin" />
          </div>
        )}

        {/* Success Icon */}
        {status === "success" && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#10B981]"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        )}

        {/* Error Icon */}
        {status === "error" && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
        )}

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-xl font-serif tracking-tight text-white">{message}</h1>
          <p className="text-xs font-mono text-offgray-500 uppercase tracking-widest leading-relaxed">
            {status === "loading" && "Authenticating..."}
            {status === "success" && "Routing to dashboard"}
            {status === "error" && "Routing to homepage"}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <div className={`w-1.5 h-1.5 rounded-full ${status === "loading" ? "bg-[#10B981] animate-bounce" : "bg-white/[0.04]"}`} style={{ animationDelay: '0ms' }} />
          <div className={`w-1.5 h-1.5 rounded-full ${status === "loading" ? "bg-[#10B981] animate-bounce" : "bg-white/[0.04]"}`} style={{ animationDelay: '150ms' }} />
          <div className={`w-1.5 h-1.5 rounded-full ${status === "loading" ? "bg-[#10B981] animate-bounce" : "bg-white/[0.04]"}`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
