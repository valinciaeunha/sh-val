"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import getCroppedImg from "@/lib/utils/cropImage";

interface ImageCropperProps {
    imageSrc: string;
    aspect: number;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    objectFit?: "contain" | "horizontal-cover" | "vertical-cover";
}

export function ImageCropper({ imageSrc, aspect, onCropComplete, onCancel, objectFit = "contain" }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsLoading(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            // error silently handled
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-panel border border-white/[0.1] rounded-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">Adjust Image</h3>
                    <button onClick={onCancel} className="text-offgray-500 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="relative w-full h-[400px] bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteHandler}
                        objectFit={objectFit}
                        showGrid={true}
                    />
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-offgray-400 font-medium w-8">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-emerald-400"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm text-offgray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? "Processing..." : "Apply"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
