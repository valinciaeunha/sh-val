import apiClient from "./client";
import { Script } from "./scripts";

export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
    totalScripts: number;
    totalViews: number;
    totalLikes: number;
}

export interface DashboardStats {
    totalScripts: number;
    totalViews: number;
    totalDownloads: number;
    totalLikes: number;
    avgRating: number;
    viewsHistory: {
        date: string;
        views: number;
    }[];
}

const mapScriptData = (data: any): Script => ({
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
    loaderUrl: data.loader_url || data.loaderUrl,
    hubId: data.hub_id || data.hubId,
    gameId: data.game_id || data.gameId,
    ownerId: data.owner_id || data.ownerId,
    status: data.status,
    views: parseInt(data.views || 0),
    likes: parseInt(data.likes || 0),
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    ownerUsername: data.owner_username || data.ownerUsername,
    ownerDisplayName: data.owner_display_name || data.ownerDisplayName,
    hubName: data.hub_name || data.hubName,
    gameName: data.game_name || data.gameName,
    gameLogoUrl: data.game_logo_url || data.gameLogoUrl,
    tags: data.tags || [],
});

export const getProfile = async (username: string): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${username}`);
    const data = response.data.data;
    return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        createdAt: data.created_at,
        totalScripts: parseInt(data.total_scripts || 0),
        totalViews: parseInt(data.total_views || 0),
        totalLikes: parseInt(data.total_likes || 0),
    };
};

export const getUserScripts = async (username: string): Promise<Script[]> => {
    const response = await apiClient.get(`/users/${username}/scripts`);
    return response.data.data.map(mapScriptData);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/users/me/stats");
    return response.data.data;
};

export const usersApi = {
    getProfile,
    getUserScripts,
    getDashboardStats,
    getApiKey: async () => {
        const res = await apiClient.get('/users/me/api-key');
        return res.data.data;
    },
    generateApiKey: async () => {
        const res = await apiClient.post('/users/me/api-key/generate');
        return res.data.data;
    }
};
