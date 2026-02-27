"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { scriptsApi } from "@/lib/api/scripts";
import { hubsApi, Hub } from "@/lib/api/hubs";
import { dataURLtoBlob } from "@/lib/utils/cropImage";
import { ScriptForm } from "@/components/studio/ScriptForm";

export default function NewScriptPage() {
    const router = useRouter();
    const [hubsList, setHubsList] = useState<Hub[]>([]);

    // Fetch Hubs
    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const data = await hubsApi.getMyHubs();
                // Only show active hubs
                setHubsList(data.filter((h: Hub) => h.status === 'active'));
            } catch (err) {
                // error silently handled
            }
        };
        fetchHubs();
    }, []);

    const handleSubmit = async (data: any) => {
        const scriptData: any = {
            title: data.title,
            description: data.description,
            loaderUrl: data.loaderUrl,
            tags: data.tags.length > 0 ? data.tags.join(",") : undefined,
            gamePlatformId: data.gamePlatformId || undefined,
            hubId: data.hubId || undefined,
            isPaid: data.isPaid,
            purchaseUrl: data.isPaid ? data.purchaseUrl : undefined,
            hasKeySystem: data.hasKeySystem,
            keySystemUrl: data.hasKeySystem ? data.keySystemUrl : undefined,
        };

        if (data.thumbnail) {
            scriptData.thumbnail = data.thumbnail;
        }

        await scriptsApi.createScript(scriptData);
        router.push("/studio/scripts");
        router.refresh();
    };

    return (
        <ScriptForm
            hubs={hubsList}
            onSubmit={handleSubmit}
        />
    );
}
