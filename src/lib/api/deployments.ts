import apiClient from "./client";

// ============================================
// Types
// ============================================

export interface Deployment {
    id: string;
    title: string;
    deploy_key: string;
    s3_key: string;
    file_size: number;
    mime_type: string;
    status: string;
    content?: string;
    created_at: string;
    updated_at: string;
}

export interface DeploymentStats {
    total_deployments: number;
    active_deployments: number;
    total_size: number;
    cdn_requests: number;
}

export interface DeploymentsListResponse {
    deployments: Deployment[];
    total: number;
    page: number;
    totalPages: number;
}

// ============================================
// API Functions
// ============================================

export const deploymentsApi = {
    /**
     * Get user's deployments (paginated)
     */
    getMyDeployments: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<DeploymentsListResponse> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);

        const query = searchParams.toString();
        const res = await apiClient.get(`/deployments/me${query ? `?${query}` : ""}`);
        return res.data.data;
    },

    /**
     * Get deployment stats
     */
    getStats: async (): Promise<DeploymentStats> => {
        const res = await apiClient.get("/deployments/stats");
        return res.data.data;
    },

    /**
     * Get a single deployment with content
     */
    getById: async (id: string): Promise<Deployment> => {
        const res = await apiClient.get(`/deployments/${id}`);
        return res.data.data;
    },

    /**
     * Create new deployment
     */
    create: async (data: { title: string; content: string }): Promise<Deployment> => {
        const res = await apiClient.post("/deployments", data);
        return res.data.data;
    },

    /**
     * Upload new deployment (multipart)
     */
    upload: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<Deployment> => {
        const res = await apiClient.post("/deployments/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        });
        return res.data.data;
    },

    /**
     * Update deployment
     */
    update: async (id: string, data: { title?: string; content?: string }): Promise<Deployment> => {
        const res = await apiClient.put(`/deployments/${id}`, data);
        return res.data.data;
    },

    /**
     * Delete a deployment
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/deployments/${id}`);
    },
};
