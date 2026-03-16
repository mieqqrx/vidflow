"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useGetVideoByIdQuery, useUpdateVideoDetailsMutation } from "@/store/api";
// Импортируем сам компонент и его тип данных (Payload)
import VideoDetailsForm, { VideoDetailsUpdatePayload } from "@/components/Studio/VideoDetailsForm";
import VideoTrimmer from "@/components/Studio/VideoTrimmer";

export default function VideoEditorPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params.id as string;

    const { data: video, isLoading, error } = useGetVideoByIdQuery(videoId);

    const [updateDetails, { isLoading: isUpdating }] = useUpdateVideoDetailsMutation();

    // Теперь мы принимаем готовый объект из компонента формы, а не сырой FormData
    const handleSaveDetails = async (payload: VideoDetailsUpdatePayload) => {
        try {
            // Передаем id и весь payload в RTK Query.
            // Твоя мутация в apiSlice сама соберет из этого FormData для отправки на бэкенд!
            await updateDetails({
                id: videoId,
                ...payload
            }).unwrap();

            toast.success("Video details saved successfully");
        } catch (err) {
            console.error("Failed to update video:", err);
            toast.error("Failed to save changes");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#282828] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen bg-[#282828] text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-xl">Video not found</h1>

                <Button onClick={() => router.push("/studio")} variant="secondary">
                    Back to Studio
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#282828] text-white font-sans flex flex-col pt-14">
            <div className="px-8 py-5 border-b border-[#3f3f3f] flex items-center justify-between bg-[#282828] z-40 sticky top-14">
                <div className="flex items-center gap-4">
                    <Link href="/studio" className="text-[#aaaaaa] hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>

                    <h1 className="text-[24px] font-semibold truncate max-w-[500px]">
                        Video details
                    </h1>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/studio")}
                        className="text-[#aaaaaa] hover:text-white cursor-pointer"
                        disabled={isUpdating}
                    >
                        Undo changes
                    </Button>

                    <Button
                        onClick={() => document.getElementById('submit-details-form')?.click()}
                        disabled={isUpdating}
                        className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium disabled:opacity-50 min-w-[80px] cursor-pointer"
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 px-8 py-6 w-full">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-transparent border-b border-[#3f3f3f] w-full justify-start rounded-none h-auto p-0 flex gap-8">
                        <TabsTrigger
                            value="details"
                            className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3ea6ff] data-[state=active]:shadow-none rounded-none px-0 pb-3 text-[15px] font-medium text-[#aaaaaa] data-[state=active]:text-[#3ea6ff] transition-colors"
                        >
                            Details
                        </TabsTrigger>

                        <TabsTrigger
                            value="editor"
                            className="cursor-pointer data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3ea6ff] data-[state=active]:shadow-none rounded-none px-0 pb-3 text-[15px] font-medium text-[#aaaaaa] data-[state=active]:text-[#3ea6ff] transition-colors"
                        >
                            Editor
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-8 focus-visible:outline-none">
                        <VideoDetailsForm
                            video={video}
                            onSave={handleSaveDetails}
                            isSaving={isUpdating}
                        />
                    </TabsContent>

                    <TabsContent value="editor" className="mt-8 focus-visible:outline-none">
                        <VideoTrimmer video={video} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}