"use client";

import React from "react";
import TopMenu from "@/components/TopMenu/TopMenu";
import VideoCard from "@/components/Thumbnail/VideoCard";
import { useGetAllVideosQuery } from "@/store/api/apiSlice";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
    const { data: videos, isLoading, isError } = useGetAllVideosQuery();

    return (
        <div className="flex flex-col min-h-screen">
            <TopMenu />

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center mt-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
                </div>
            ) : isError ? (
                <div className="flex-1 flex flex-col items-center justify-center mt-20 text-[#AAAAAA]">
                    <p className="text-lg">Oops, couldn't load videos.</p>
                    <p className="text-sm mt-2">Please check your server connection.</p>
                </div>
            ) : (
                <div className="p-4 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 pb-10">
                    {videos?.map((video) => {
                        const timeAgo = video.createdAt
                            ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
                            : "Recently";

                        return (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                thumbnail={video.thumbnailUrl}
                                duration={video.durationSeconds}
                                title={video.title}
                                channelId={video.channelId}
                                channelName={video.channelName || "Unknown Channel"}
                                channelAvatar={video.channel?.avatarUrl || null}
                                views={video.viewsCount}
                                postedAt={timeAgo}
                            />
                        );
                    })}

                    {videos?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center mt-20 text-[#AAAAAA]">
                            <p className="text-lg font-medium">Nothing to see here yet</p>
                            <p className="text-sm mt-2">Be the first to upload a video!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}