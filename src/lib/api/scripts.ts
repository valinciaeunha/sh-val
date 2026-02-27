import apiClient, { handleApiError } from './client';

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

export interface CreateScriptData {
    title: string;
    description?: string;
    loaderUrl?: string;
    hubId?: string;
    gamePlatformId?: string;
    tags?: string;
    thumbnail?: Blob;
    isPaid?: boolean;
    purchaseUrl?: string;
    hasKeySystem?: boolean;
    keySystemUrl?: string;
}

export interface Script {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    loaderUrl?: string;
    hubId?: string;
    gameId?: string;
    ownerId: string;
    status: 'published' | 'draft' | 'under_review';
    views: number;
    likes: number;
    createdAt: string;
    updatedAt: string;
    // Joined fields
    ownerUsername?: string;
    ownerDisplayName?: string;
    ownerAvatarUrl?: string;
    hubName?: string;
    hubSlug?: string;
    hubLogoUrl?: string;
    gameName?: string;
    gameSlug?: string;
    gameLogoUrl?: string;
    gameBannerUrl?: string;
    tags?: Tag[];
    isLiked?: boolean;
    comments_count?: number;
    commentsCount?: number;
    // Monetization
    isPaid?: boolean;
    purchaseUrl?: string;
    hasKeySystem?: boolean;
    keySystemUrl?: string;
    gamePlatformId?: string;
}

export interface Comment {
    id: string;
    scriptId: string;
    userId: string;
    content: string;
    parentId?: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    replyCount?: number;
}

export const mapScriptData = (data: any): Script => ({
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
    views: data.views || 0,
    likes: data.likes || 0,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    ownerUsername: data.owner_username || data.ownerUsername,
    ownerDisplayName: data.owner_display_name || data.ownerDisplayName,
    ownerAvatarUrl: data.owner_avatar_url || data.ownerAvatarUrl,
    hubName: data.hub_name || data.hubName,
    hubSlug: data.hub_slug || data.hubSlug,
    hubLogoUrl: data.hub_logo_url || data.hubLogoUrl,
    gameName: data.game_name || data.gameName,
    gameSlug: data.game_slug || data.gameSlug,
    gameLogoUrl: data.game_logo_url || data.gameLogoUrl,
    gameBannerUrl: data.game_banner_url || data.gameBannerUrl,
    tags: data.tags || [],
    isLiked: data.is_liked || data.isLiked || false,
    // Monetization
    isPaid: data.is_paid || data.isPaid || false,
    purchaseUrl: data.purchase_url || data.purchaseUrl,
    hasKeySystem: data.has_key_system || data.hasKeySystem || false,
    keySystemUrl: data.key_system_url || data.keySystemUrl,
    gamePlatformId: data.game_platform_id || data.gamePlatformId,
});

/**
 * Create a new script
 */
export const createScript = async (data: CreateScriptData): Promise<Script> => {
    try {
        const formData = new FormData();
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.loaderUrl) formData.append('loaderUrl', data.loaderUrl);
        if (data.hubId) formData.append('hubId', data.hubId);
        if (data.gamePlatformId) formData.append('gamePlatformId', data.gamePlatformId);
        if (data.tags) formData.append('tags', data.tags);
        if (data.thumbnail) formData.append('thumbnail', data.thumbnail);

        // Monetization fields
        if (data.isPaid !== undefined) formData.append('isPaid', String(data.isPaid));
        if (data.purchaseUrl) formData.append('purchaseUrl', data.purchaseUrl);
        if (data.hasKeySystem !== undefined) formData.append('hasKeySystem', String(data.hasKeySystem));
        if (data.keySystemUrl) formData.append('keySystemUrl', data.keySystemUrl);

        const response = await apiClient.post('/scripts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return mapScriptData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Update a script
 */
export const updateScript = async (id: string, data: any): Promise<Script> => {
    try {
        const formData = new FormData();
        // Append fields carefully
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && key !== 'thumbnail') {
                formData.append(key, String(data[key]));
            }
        });
        if (data.thumbnail instanceof File) formData.append('thumbnail', data.thumbnail);

        const response = await apiClient.patch(`/scripts/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return mapScriptData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get current user's scripts
 */
export const getMyScripts = async (): Promise<Script[]> => {
    try {
        const response = await apiClient.get('/scripts/me');
        return response.data.data.map(mapScriptData);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get all published scripts with pagination
 */
export const getAllScripts = async (
    filters: { tag?: string; query?: string; hubId?: string; sortBy?: string; seed?: string; page?: number; limit?: number } = {}
): Promise<{ scripts: Script[]; pagination: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean } }> => {
    try {
        const response = await apiClient.get('/scripts', { params: filters });
        return {
            scripts: response.data.data.map(mapScriptData),
            pagination: response.data.pagination || {
                total: response.data.data.length,
                page: 1,
                limit: 30,
                totalPages: 1,
                hasMore: false,
            },
        };
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get script by slug
 */
export const getScriptBySlug = async (slug: string): Promise<Script> => {
    try {
        const response = await apiClient.get(`/scripts/slug/${slug}`);
        return mapScriptData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get script by ID
 */
export const getScriptById = async (id: string): Promise<Script> => {
    try {
        const response = await apiClient.get(`/scripts/${id}`);
        return mapScriptData(response.data.data);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Soft delete a script
 */
export const deleteScript = async (id: string) => {
    try {
        const response = await apiClient.delete(`/scripts/${id}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Record a view
 */
export const recordView = async (id: string) => {
    try {
        const response = await apiClient.post(`/scripts/${id}/view`);
        return response.data;
    } catch (error) {
        // Silently fail for views to not disrupt UX
        // error silently handled
        return { success: false };
    }
};

/**
 * Record a copy event
 */
export const recordCopy = async (id: string) => {
    try {
        const response = await apiClient.post(`/scripts/${id}/copy`);
        return response.data;
    } catch (error) {
        // error silently handled
        return { success: false };
    }
};

/**
 * Toggle like
 */
export const toggleLike = async (id: string) => {
    try {
        const response = await apiClient.post(`/scripts/${id}/like`);
        return response.data.data; // { isLiked: boolean }
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get comments
 */
export const getComments = async (id: string): Promise<Comment[]> => {
    try {
        const response = await apiClient.get(`/scripts/${id}/comments`);
        return response.data.data.map((c: any) => ({
            id: c.id,
            scriptId: c.script_id || c.scriptId,
            userId: c.user_id || c.userId,
            content: c.content,
            parentId: c.parent_id || c.parentId,
            isPinned: c.is_pinned || c.isPinned || false,
            createdAt: c.created_at || c.createdAt,
            updatedAt: c.updated_at || c.updatedAt,
            username: c.username,
            displayName: c.display_name || c.displayName,
            avatarUrl: c.avatar_url || c.avatarUrl,
            replyCount: parseInt(c.reply_count || c.replyCount || '0', 10),
        }));
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Post a comment
 */
export const postComment = async (id: string, content: string, parentId: string | null = null) => {
    try {
        const response = await apiClient.post(`/scripts/${id}/comments`, { content, parentId });
        return response.data.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (scriptId: string, commentId: string) => {
    try {
        const response = await apiClient.delete(`/scripts/${scriptId}/comments/${commentId}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const scriptsApi = {
    createScript,
    updateScript,
    getMyScripts,
    getAllScripts,
    getScriptBySlug,
    getScriptById,
    deleteScript,
    recordView,
    recordCopy,
    toggleLike,
    getComments,
    postComment,
    deleteComment,
};

export default scriptsApi;

