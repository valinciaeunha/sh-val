"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { authApi } from "@/lib/api/auth";

interface AuthContextType {
    isAuthModalOpen: boolean;
    authModalTab: "login" | "register";
    openAuthModal: (tab: "login" | "register") => void;
    closeAuthModal: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

    const openAuthModal = (tab: "login" | "register") => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const refreshUser = () => {
        // This can be used to notify other components that auth state changed
        // In many cases, components use hooks like useUser which might need to be updated
        // or we can reload the page if needed, but a state change is cleaner.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-change'));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthModalOpen,
                authModalTab,
                openAuthModal,
                closeAuthModal,
                refreshUser,
            }}
        >
            {children}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                defaultTab={authModalTab}
                onLogin={refreshUser}
            />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
