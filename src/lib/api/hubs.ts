import apiClient, { handleApiError } from './client';
import { Script } from './scripts';

export interface CreateHubData {
    name: string;
    description: string;
    discordServer?: string;
    banner?: Blob;
    logo?: Blob;
}

export interface UpdateHubData {
    name?: string;
    description?: string;
    discordServer?: string;
    banner?: Blob;
    logo?: Blob;
}

export interface Hub {
    id: string;
    name: string;
    slug: string;
    description?: string;
    discordServer?: string;
    bannerUrl?: string;
    logoUrl?: string;
    ownerId: string;
    status: 'active' | 'pending' | 'suspended' | 'deleted';
    isOfficial: boolean;
    isVerified: boolean;
    scriptCount: number;
    createdAt: string;
    updatedAt: string;
    scripts?: Script[];
}

// Helper to map DB result to Hub interface
const mapHubData = (data: any): Hub => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    discordServer: data.discord_server || data.discordServer,
    bannerUrl: data.banner_url || data.bannerUrl,
    logoUrl: data.logo_url || data.logoUrl,
    ownerId: data.owner_id || data.ownerId,
    status: data.status,
    isOfficial: data.is_official || data.isOfficial || false,
    isVerified: data.is_verified || data.isVerified || false,
    scriptCount: parseInt(data.script_count || data.scriptCount || '0', 10),
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
});

/**
 * Create a new hub
 */
export const createHub = async (data: CreateHubData): Promise<Hub> => {
    try {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.discordServer) formData.append('discordServer', data.discordServer);
        if (data.banner) formData.append('banner', data.banner);
        if (data.logo) formData.append('logo', data.logo);

        const response = await apiClient.post('/hubs', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapHubData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get all active hubs
 */
export const getAllHubs = async (): Promise<Hub[]> => {
    try {
        const response = await apiClient.get('/hubs');
        return response.data.data.map(mapHubData);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get current user's hubs
 */
export const getMyHubs = async (): Promise<Hub[]> => {
    try {
        const response = await apiClient.get('/hubs/me');
        return response.data.data.map(mapHubData);
    } catch (error) {
        throw handleApiError(error);
    }
};



/**
 * Update a hub
 */
export const updateHub = async (id: string, data: UpdateHubData): Promise<Hub> => {
    try {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.discordServer !== undefined) formData.append('discordServer', data.discordServer);
        if (data.banner) formData.append('banner', data.banner);
        if (data.logo) formData.append('logo', data.logo);

        const response = await apiClient.patch(`/hubs/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapHubData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get hub by slug
 */
export const getHubBySlug = async (slug: string): Promise<Hub> => {
    try {
        const response = await apiClient.get(`/hubs/slug/${slug}`);
        const hub = mapHubData(response.data.data);

        // Add scripts if they exist in the response
        if (response.data.data.scripts) {
            hub.scripts = response.data.data.scripts.map((s: any) => ({
                id: s.id,
                title: s.title,
                slug: s.slug,
                description: s.description,
                thumbnailUrl: s.thumbnail_url,
                loaderUrl: s.loader_url,
                ownerId: s.owner_id,
                status: s.status,
                views: s.views || 0,
                likes: s.likes || 0,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
                gameName: s.game_name,
                gameLogoUrl: s.game_logo_url,
            }));
        }

        return hub;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Add script to hub
 */
export const addScriptToHub = async (hubId: string, scriptId: string) => {
    try {
        const response = await apiClient.post(`/hubs/${hubId}/scripts/${scriptId}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Remove script from hub (detach only, not delete)
 */
export const removeScriptFromHub = async (hubId: string, scriptId: string) => {
    try {
        const response = await apiClient.delete(`/hubs/${hubId}/scripts/${scriptId}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get scripts belonging to a hub (for management)
 */
export const getHubScripts = async (hubId: string) => {
    try {
        const response = await apiClient.get(`/hubs/${hubId}/scripts`);
        return response.data.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const hubsApi = {
    createHub,
    getAllHubs,
    getMyHubs,
    updateHub,
    getHubBySlug,
    addScriptToHub,
    removeScriptFromHub,
    getHubScripts,
};

export default hubsApi;

