import api from "./client";

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

export const tagsApi = {
    /**
     * Search for existing tags
     */
    searchTags: async (query: string): Promise<Tag[]> => {
        const { data } = await api.get(`/tags/search?q=${encodeURIComponent(query)}`);
        return data.data;
    },

    /**
     * Get all tags
     */
    getAllTags: async (): Promise<Tag[]> => {
        const { data } = await api.get("/tags");
        return data.data;
    }
};
