"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

import { useGetSubscriptionsQuery, useGetSubscriptionVideosQuery } from "@/store/api";
import VideoCard from "@/components/Thumbnail/VideoCard";
import { Subscription, Video } from "@/types";
import { fixUrl } from "@/utils/fixUrl";

export default function SubscriptionsPage() {
    const { data: subscriptions, isLoading: subsLoading } = useGetSubscriptionsQuery();
    const { data: videos, isLoading: videosLoading } = useGetSubscriptionVideosQuery();

    if (subsLoading || videosLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    console.log("МОИ ПОДПИСКИ:", subscriptions);

    return (
        <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-6 overflow-hidden">
            {subscriptions && subscriptions.length > 0 && (
                <div className="mb-8 pb-6 border-b border-[#3F3F3F]/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Latest from subscriptions</h2>
                        <Link href="/channels" className="text-sm font-medium text-[#3ea6ff] hover:text-[#6ebcff] transition-colors">
                            Manage
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x cursor-grab active:cursor-grabbing">
                        {subscriptions.map((sub: Subscription) => (
                            <Link
                                key={sub.id}
                                href={`/channel/${sub.channelId}`}
                                className="flex flex-col items-center gap-2 min-w-[84px] snap-start group"
                            >
                                <div className="relative">
                                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-transparent group-hover:border-[#3ea6ff] transition-all duration-300">
                                        <AvatarImage
                                            src={fixUrl(sub.channelAvatarUrl || sub.avatarUrl || sub.ownerAvatarUrl) || undefined}
                                            className="object-cover"
                                        />

                                        <AvatarFallback className="bg-[#272727] text-white text-xl">
                                            {(sub.channelName || sub.name)?.[0]?.toUpperCase() || "C"}
                                        </AvatarFallback>
                                    </Avatar>

                                    {sub.hasNewVideos && (
                                        <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-3.5 h-3.5 bg-[#3ea6ff] border-2 border-[#0F0F0F] rounded-full"></div>
                                    )}
                                </div>
                                <span className="text-[13px] text-[#AAAAAA] group-hover:text-white text-center w-full truncate px-1 transition-colors">
                                    {sub.channelName || sub.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div>
                {videos && videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                        {videos.map((video: Video) => (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                title={video.title}
                                thumbnail={video.thumbnailUrl || null}
                                duration={video.durationSeconds}
                                channelId={video.channelId}
                                channelName={video.channelName}
                                channelAvatar={video.channelAvatarUrl || null}
                                views={video.viewsCount}
                                postedAt={new Date(video.createdAt).toLocaleDateString()}
                                watchedPercent={video.watchedPercent}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-[#AAAAAA]">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-xl font-bold text-white mb-2">No new videos</h2>
                        <p className="text-sm text-center max-w-md">
                            The channels you are subscribed to haven't uploaded any new videos recently.
                        </p>
                        <Link href="/explore">
                            <button className="mt-6 px-6 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white font-medium rounded-full transition-colors">
                                Explore channels
                            </button>
                        </Link>
                    </div>
                )}
            </div>

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