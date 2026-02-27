"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { scriptsApi } from "@/lib/api/scripts";
import { hubsApi, Hub } from "@/lib/api/hubs";
import { getStorageUrl } from "@/lib/utils/image";
import { ScriptForm } from "@/components/studio/ScriptForm";

export default function StudioScriptEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: scriptId } = use(params);

    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);
    const [hubsList, setHubsList] = useState<Hub[]>([]);

    useEffect(() => {
        if (!authApi.isAuthenticated()) {
            router.push("/home");
            return;
        }

        const fetchData = async () => {
            try {
                const [scriptData, hubsData] = await Promise.all([
                    scriptsApi.getScriptById(scriptId),
                    hubsApi.getMyHubs()
                ]);

                if (!scriptData) {
                    router.push("/studio/scripts");
                    return;
                }

                // Only show active hubs
                setHubsList(hubsData.filter((h: Hub) => h.status === 'active'));

                // Use game data already returned from getScriptById (via SQL JOIN)
                // instead of calling lookupGame which can misinterpret Universe IDs as Place IDs
                let gamePreview = null;
                const gamePlatformId = scriptData.gamePlatformId;

                if (gamePlatformId && scriptData.gameName) {
                    gamePreview = {
                        name: scriptData.gameName,
                        logo_url: scriptData.gameLogoUrl,
                        banner_url: scriptData.gameBannerUrl,
                        game_platform_id: gamePlatformId,
                    };
                }

                setInitialData({
                    title: scriptData.title,
                    description: scriptData.description || "",
                    loaderUrl: scriptData.loaderUrl || "",
                    tags: scriptData.tags ? scriptData.tags.map((t: any) => typeof t === 'string' ? t : t.name) : [],
                    gamePlatformId: gamePlatformId || "",
                    hubId: scriptData.hubId || "",
                    isPaid: scriptData.isPaid || false,
                    purchaseUrl: scriptData.purchaseUrl || "",
                    hasKeySystem: scriptData.hasKeySystem || false,
                    keySystemUrl: scriptData.keySystemUrl || "",
                    thumbnailPreview: scriptData.thumbnailUrl ? getStorageUrl(scriptData.thumbnailUrl) : null,
                    gamePreview
                });

            } catch (error) {
                // error silently handled
                router.push("/studio/scripts");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [scriptId, router]);

    const handleSubmit = async (data: any) => {
        try {
            await scriptsApi.updateScript(scriptId, {
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail, // ScriptForm passes File object if changed
                tags: data.tags.join(","),
                gamePlatformId: data.gamePlatformId,
                loaderUrl: data.loaderUrl,
                hubId: data.hubId,
                isPaid: data.isPaid,
                purchaseUrl: data.isPaid ? data.purchaseUrl : undefined,
                hasKeySystem: data.hasKeySystem,
                keySystemUrl: data.hasKeySystem ? data.keySystemUrl : undefined,
            });
            router.push("/studio/scripts");
            router.refresh();
        } catch (error: any) {
            // error silently handled
            throw error; // Re-throw so ScriptForm handles the error state
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-emerald-500 rounded-full animate-spin border-t-transparent" /></div>;
    }

    return (
        <ScriptForm
            initialData={initialData}
            hubs={hubsList}
            onSubmit={handleSubmit}
            isEditMode={true}
        />
    );
}

