"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Radio, PlaySquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMyChannelQuery } from "@/store/api";

import VideosTab from "@/components/Studio/VideosTab";
import LiveTab from "@/components/Studio/LiveTab";
import ShortsTab from "@/components/Studio/ShortsTab";

type TabType = "videos" | "shorts" | "live";

export default function StudioContentPage() {
    const [activeTab, setActiveTab] = useState<TabType>("videos");

    const { data: myChannel, isLoading: isChannelLoading } = useGetMyChannelQuery();

    if (isChannelLoading) {
        return (
            <div className="h-screen bg-[#1f1f1f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (!myChannel) {
        return (
            <div className="h-screen bg-[#1f1f1f] text-white flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">You don't have a channel yet</h1>
                <Link href="/">
                    <Button className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black cursor-pointer">
                        Return to Home
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-[100vh] bg-[#1f1f1f] text-white font-sans flex flex-col overflow-hidden">
            <div className="px-8 py-5 border-b border-[#3f3f3f] bg-[#282828] shrink-0">
                <h1 className="text-[24px] font-semibold">Channel content</h1>

                <div className="flex gap-6 mt-4 border-b border-[#3f3f3f]">
                    <div
                        onClick={() => setActiveTab("videos")}
                        className={`pb-3 cursor-pointer transition-colors ${activeTab === "videos" ? "border-b-2 border-white font-medium" : "text-[#aaaaaa] hover:text-white"}`}
                    >
                        Videos
                    </div>
                    <div
                        onClick={() => setActiveTab("shorts")}
                        className={`pb-3 cursor-pointer transition-colors ${activeTab === "shorts" ? "border-b-2 border-white font-medium" : "text-[#aaaaaa] hover:text-white"}`}
                    >
                        Shorts
                    </div>
                    <div
                        onClick={() => setActiveTab("live")}
                        className={`pb-3 cursor-pointer transition-colors ${activeTab === "live" ? "border-b-2 border-white font-medium flex items-center gap-2" : "text-[#aaaaaa] hover:text-white flex items-center gap-2"}`}
                    >
                        <Radio className="w-4 h-4" /> Live
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative">
                {activeTab === "videos" && <VideosTab channelId={myChannel.id} />}

                {activeTab === "shorts" && (
                    <ShortsTab channelId={myChannel.id} />
                )}

                {activeTab === "live" && <LiveTab channelId={myChannel.id} />}
            </div>
        </div>
    );
}