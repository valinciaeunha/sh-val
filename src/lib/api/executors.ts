import apiClient, { handleApiError } from './client';

export interface ExecutorVersion {
    id: string;
    executorId: string;
    version: string;
    downloadUrl: string;
    patchNotes?: string;
    createdAt: string;
}

export interface Executor {
    id: string;
    name: string;
    slug: string;
    description?: string;
    website?: string;
    discord?: string;
    telegram?: string;
    platforms: string[];
    priceModel: 'Free' | 'Keyless' | 'Paid';
    status: 'Working' | 'Updating' | 'Patched' | 'Discontinued' | 'Pending';
    logoUrl?: string;
    bannerUrl?: string;
    tags: string[];
    ownerId: string;
    ownerUsername?: string;
    latestVersion?: string;
    createdAt: string;
    updatedAt: string;
    versions?: ExecutorVersion[];
}

export interface CreateExecutorData {
    name: string;
    description?: string;
    website?: string;
    discord?: string;
    telegram?: string;
    platforms: string[];
    priceModel: string;
    tags: string[];
    version?: string;
    downloadUrl?: string;
    patchNotes?: string;
    logo?: Blob;
    banner?: Blob;
}

// Helper to map DB result to Executor interface
const mapExecutorData = (data: any): Executor => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    website: data.website,
    discord: data.discord,
    telegram: data.telegram,
    platforms: data.platforms || [],
    priceModel: data.price_model || data.priceModel,
    status: data.status,
    logoUrl: data.logo_url || data.logoUrl,
    bannerUrl: data.banner_url || data.bannerUrl,
    tags: data.tags || [],
    ownerId: data.owner_id || data.ownerId,
    ownerUsername: data.owner_username || data.ownerUsername,
    latestVersion: data.latest_version || data.latestVersion,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    versions: data.versions ? data.versions.map((v: any) => ({
        id: v.id,
        executorId: v.executor_id || v.executorId,
        version: v.version,
        downloadUrl: v.download_url || v.downloadUrl,
        patchNotes: v.patch_notes || v.patchNotes,
        createdAt: v.created_at || v.createdAt
    })) : undefined
});

/**
 * Create a new executor (with optional initial version)
 */
export const createExecutor = async (data: CreateExecutorData): Promise<Executor> => {
    try {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.website) formData.append('website', data.website);
        if (data.discord) formData.append('discord', data.discord);
        if (data.telegram) formData.append('telegram', data.telegram);
        formData.append('priceModel', data.priceModel);

        // Pass arrays as JSON strings
        formData.append('platforms', JSON.stringify(data.platforms));
        formData.append('tags', JSON.stringify(data.tags));

        if (data.version) formData.append('version', data.version);
        if (data.downloadUrl) formData.append('downloadUrl', data.downloadUrl);
        if (data.patchNotes) formData.append('patchNotes', data.patchNotes);

        if (data.logo) formData.append('logo', data.logo);
        if (data.banner) formData.append('banner', data.banner);

        const response = await apiClient.post('/executors', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapExecutorData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get all active executors (public)
 */
export const getAllExecutors = async (): Promise<Executor[]> => {
    try {
        const response = await apiClient.get('/executors');
        return response.data.data.map(mapExecutorData);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get current user's executors
 */
export const getMyExecutors = async (): Promise<Executor[]> => {
    try {
        const response = await apiClient.get('/executors/me');
        return response.data.data.map(mapExecutorData);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get executor by slug (public)
 */
export const getExecutorBySlug = async (slug: string): Promise<Executor> => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await apiClient.get(`/executors/slug/${slug}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        return mapExecutorData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

export interface AddExecutorVersionData {
    version: string;
    downloadUrl: string;
    patchNotes?: string;
}

/**
 * Add a new version release to an executor
 */
export const addExecutorVersion = async (slug: string, data: AddExecutorVersionData): Promise<ExecutorVersion> => {
    try {
        const response = await apiClient.post(`/executors/${slug}/versions`, data);
        const v = response.data.data;
        return {
            id: v.id,
            executorId: v.executor_id || v.executorId,
            version: v.version,
            downloadUrl: v.download_url || v.downloadUrl,
            patchNotes: v.patch_notes || v.patchNotes,
            createdAt: v.created_at || v.createdAt
        };
    } catch (error) {
        throw handleApiError(error);
    }
};

export interface UpdateExecutorData {
    name?: string;
    description?: string;
    website?: string;
    discord?: string;
    telegram?: string;
    platforms?: string[];
    priceModel?: string;
    tags?: string[];
    status?: string;
    logo?: File;
    banner?: File;
}

/**
 * Update an executor
 */
export const updateExecutor = async (id: string, data: UpdateExecutorData): Promise<Executor> => {
    try {
        const formData = new FormData();

        if (data.name) formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.website) formData.append('website', data.website);
        if (data.discord) formData.append('discord', data.discord);
        if (data.telegram) formData.append('telegram', data.telegram);
        if (data.priceModel) formData.append('priceModel', data.priceModel);
        if (data.status) formData.append('status', data.status);

        if (data.platforms) {
            formData.append('platforms', JSON.stringify(data.platforms));
        }

        if (data.tags) {
            formData.append('tags', JSON.stringify(data.tags));
        }

        if (data.logo) formData.append('logo', data.logo);
        if (data.banner) formData.append('banner', data.banner);

        const response = await apiClient.patch(`/executors/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapExecutorData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

export interface UpdateExecutorVersionData {
    version?: string;
    downloadUrl?: string;
    patchNotes?: string;
}

/**
 * Update an existing version release
 */
export const updateExecutorVersion = async (executorId: string, versionId: string, data: UpdateExecutorVersionData): Promise<ExecutorVersion> => {
    try {
        const response = await apiClient.patch(`/executors/${executorId}/versions/${versionId}`, data);
        const v = response.data.data;
        return {
            id: v.id,
            executorId: v.executor_id || v.executorId,
            version: v.version,
            downloadUrl: v.download_url || v.downloadUrl,
            patchNotes: v.patch_notes || v.patchNotes,
            createdAt: v.created_at || v.createdAt
        };
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Delete a version release
 */
export const deleteExecutorVersion = async (executorId: string, versionId: string): Promise<void> => {
    try {
        await apiClient.delete(`/executors/${executorId}/versions/${versionId}`);
    } catch (error) {
        throw handleApiError(error);
    }
};
