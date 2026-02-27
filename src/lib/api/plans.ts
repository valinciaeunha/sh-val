import apiClient from "./client";

// ============================================
// Types
// ============================================

export interface UserPlan {
    id: string;
    user_id: string;
    plan_type: 'free' | 'pro' | 'enterprise' | 'custom';
    started_at: string;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserMaximums {
    id: string;
    user_id: string;
    maximum_obfuscation: number;
    maximum_keys: number;
    maximum_deployments: number;
    maximum_devices_per_key: number;
    maximums_reset_at: string;
    created_at: string;
    updated_at: string;
}

export interface PlanWithMaximums {
    plan: UserPlan;
    maximums: UserMaximums;
}

// ============================================
// API Functions
// ============================================

export const plansApi = {
    /**
     * Get the current user's plan and maximums
     */
    getMyPlan: async (): Promise<PlanWithMaximums> => {
        const res = await apiClient.get("/plans/me");
        return res.data.data;
    },
};
