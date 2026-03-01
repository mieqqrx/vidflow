"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

import ChannelHeader from "@/components/Channel/ChannelHeader";
import VideoCard from "@/components/Thumbnail/VideoCard";
import ChannelFeatured from "@/components/Channel/ChannelFeatured";
import UploadVideoModal from "@/components/Upload/UploadVideoModal";

import {
    useGetChannelByIdQuery,
    useGetVideosByChannelIdQuery,
    useGetMeQuery
} from "@/store/api/apiSlice";

export default function ChannelPage() {
    const params = useParams();
    const channelId = params.id as string;

    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const { data: me } = useGetMeQuery();

    const { data: channel, isLoading: isChannelLoading, error: channelError } =
        useGetChannelByIdQuery(channelId);

    const { data: videos, isLoading: isVideosLoading } =
        useGetVideosByChannelIdQuery(channelId);

    const isOwner = me?.id === channel?.ownerId;

    if (isChannelLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0F0F0F]">
                <Loader2 className="h-10 w-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (channelError || !channel) {
        return <div className="text-white p-10">Channel not found</div>;
    }

    const hasVideos = videos && videos.length > 0;

    return (
        <div className="flex flex-col min-h-screen bg-[#0F0F0F]">
            <ChannelHeader channel={channel} isOwner={isOwner} />

            <div className="p-6 md:px-16 text-white pb-20">
                {isVideosLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gray-500" />
                    </div>
                ) : hasVideos ? (
                    <>
                        <ChannelFeatured video={videos[0]} />

                        <div className="mt-8 border-t border-[#3F3F3F] pt-6">
                            <div className="flex items-center gap-2 mb-4 text-white">
                                <span className="font-medium text-[16px]">Uploads</span>
                                <div className="flex items-center gap-1 text-[#AAAAAA] text-xs font-bold uppercase tracking-wide cursor-pointer hover:text-white transition-colors ml-2">
                                    <Play className="h-3 w-3 fill-current" />
                                    <span>Play All</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {videos.map((video) => {
                                    const timeAgo = video.createdAt
                                        ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
                                        : "Recently";

                                    return (
                                        <VideoCard
                                            key={video.id}
                                            id={video.id}
                                            thumbnail={video.thumbnailUrl}
                                            title={video.title}
                                            channelId={channel.id}
                                            channelName={channel.name}
                                            channelAvatar={channel.avatarUrl || null}
                                            views={video.viewsCount}
                                            postedAt={timeAgo}
                                            duration={"10:00"}
                                            hideAvatar={true}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-24 text-center">
                        {isOwner ? (
                            <>
                                <div className="mb-6 relative">
                                    <div className="w-48 h-36 flex items-center justify-center">
                                        <img
                                            src="/empty-content-illustration.svg"
                                            alt="No content"
                                            className="w-full h-full object-contain opacity-80"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    </div>
                                </div>
                                <h2 className="text-xl font-medium mb-2">Create content on any device</h2>
                                <p className="text-[#AAAAAA] text-[14px] max-w-[420px] mb-8 leading-relaxed">
                                    Upload and record at home or on the go.
                                    Everything that you make public will appear here.
                                </p>
                                <Button
                                    onClick={() => setIsUploadOpen(true)}
                                    className="bg-white text-black hover:bg-gray-200 rounded-full px-6 h-10 font-medium transition-all cursor-pointer"
                                >
                                    Create
                                </Button>
                            </>
                        ) : (
                            <div className="mt-10">
                                <h2 className="text-xl font-medium text-[#AAAAAA]">This channel has no videos.</h2>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <UploadVideoModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />
        </div>
    );
}