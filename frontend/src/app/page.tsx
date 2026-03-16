"use client";

import React from "react";
import TopMenu from "@/components/TopMenu/TopMenu";
import VideoCard from "@/components/Thumbnail/VideoCard";
import ShortCard from "@/components/Thumbnail/ShortCard";
import { useGetRecommendationsQuery, useGetShortsRecommendationsQuery } from "@/store/api";
import { Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Video } from "@/types";

const ShortsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M17.77,10.32l-1.2-.5L18,9.06a3.74,3.74,0,0,0-3.5-6.62L6,6.94a3.74,3.74,0,0,0,.23,6.74l1.2.49L6,14.93a3.75,3.75,0,0,0,3.5,6.63l8.5-4.5a3.74,3.74,0,0,0-.23-6.74Z" />
        <polygon fill="white" points="10 14.65 15 12 10 9.35 10 14.65" />
    </svg>
);

export default function Home() {
    const { data: videos, isLoading: isVideosLoading, isError } = useGetRecommendationsQuery({ count: 24 });
    const { data: shorts, isLoading: isShortsLoading } = useGetShortsRecommendationsQuery({ count: 15 });

    const firstRowVideos = videos?.slice(0, 4) || [];
    const remainingVideos = videos?.slice(4) || [];

    const isLoading = isVideosLoading || isShortsLoading;

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
                <div className="p-4 pt-6 pb-10">
                    {firstRowVideos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                            {firstRowVideos.map((video: Video) => (
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
                                    postedAt={video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : "Recently"}
                                    watchedPercent={video.watchedPercent}
                                />
                            ))}
                        </div>
                    )}

                    {shorts && shorts.length > 0 && (
                        <div className="my-8 pt-6 pb-6 border-y border-[#3F3F3F]/60 w-full relative">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div className="flex items-center gap-2">
                                    <ShortsIcon />
                                    <h2 className="text-[20px] font-bold text-white tracking-wide">Shorts</h2>
                                </div>
                                <button className="p-1.5 text-white hover:bg-[#272727] rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 pb-2">
                                {shorts.map((short: Video) => (
                                    <div key={short.id} className="snap-start shrink-0">
                                        <ShortCard
                                            id={short.id}
                                            thumbnail={short.thumbnailUrl}
                                            title={short.title}
                                            views={short.viewsCount}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {remainingVideos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 mt-2">
                            {remainingVideos.map((video: Video) => (
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
                                    postedAt={video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : "Recently"}
                                    watchedPercent={video.watchedPercent}
                                />
                            ))}
                        </div>
                    )}

                    {videos?.length === 0 && (!shorts || shorts.length === 0) && (
                        <div className="flex flex-col items-center justify-center mt-20 text-[#AAAAAA]">
                            <p className="text-lg font-medium">Nothing to see here yet</p>
                            <p className="text-sm mt-2">Be the first to upload a video!</p>
                        </div>
                    )}
                </div>
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}