"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Play, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import ChannelHeader from "@/components/Channel/ChannelHeader";
import VideoCard from "@/components/Thumbnail/VideoCard";
import PlaylistCard from "@/components/Playlist/PlaylistCard";
import StreamCard from "@/components/Thumbnail/StreamCard";
import ChannelFeatured from "@/components/Channel/ChannelFeatured";
import UploadVideoModal from "@/components/Upload/UploadVideoModal";
import TopMenu from "@/components/TopMenu/TopMenu";

import {
    useGetChannelByIdQuery,
    useGetVideosByChannelIdQuery,
    useGetPlaylistsByChannelIdQuery,
    useGetChannelStreamsQuery,
    useGetMeQuery
} from "@/store/api";

import { LiveStreamResponse } from "@/types/stream";
import { PlaylistResponse } from "@/types";

export default function ChannelPage() {
    const params = useParams();
    const channelId = params.id as string;

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("HOME");

    const { data: me } = useGetMeQuery();

    const { data: channel, isLoading: isChannelLoading, error: channelError } =
        useGetChannelByIdQuery(channelId);

    const { data: videos, isLoading: isVideosLoading } =
        useGetVideosByChannelIdQuery(channelId);

    const { data: playlists, isLoading: isPlaylistsLoading } =
        useGetPlaylistsByChannelIdQuery(channelId);

    const { data: streams, isLoading: isStreamsLoading } =
        useGetChannelStreamsQuery(channelId);

    const isOwner = me?.id === channel?.ownerId;

    if (isChannelLoading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-[#0F0F0F]">
                <TopMenu />
                <div className="flex-1 flex items-center justify-center mt-20">
                    <Loader2 className="h-10 w-10 animate-spin text-[#3ea6ff]" />
                </div>
            </div>
        );
    }

    if (channelError || !channel) {
        return (
            <div className="flex flex-col min-h-screen bg-[#0F0F0F]">
                <TopMenu />
                <div className="text-white flex-1 flex items-center justify-center text-xl">
                    Channel not found
                </div>
            </div>
        );
    }

    const hasVideos = videos && videos.length > 0;
    const featuredVideo = channel.featuredVideo || (hasVideos ? videos[0] : null);

    return (
        <div className="flex flex-col min-h-screen bg-[#0F0F0F]">
            <div className="w-full">
                <ChannelHeader
                    channel={channel}
                    isOwner={isOwner}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    videos={videos || []}
                />

                <div className="px-6 md:px-16 text-white pb-20 mt-6">
                    {activeTab === "HOME" ? (
                        isVideosLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-[#3ea6ff] w-10 h-10" />
                            </div>
                        ) : hasVideos ? (
                            <>
                                {featuredVideo && <ChannelFeatured video={featuredVideo} />}

                                <div className="mt-8 border-t border-[#3F3F3F] pt-6">
                                    <div className="flex items-center gap-2 mb-4 text-white">
                                        <span className="font-medium text-[16px]">Uploads</span>
                                        <div className="flex items-center gap-1 text-[#AAAAAA] text-xs font-bold uppercase tracking-wide cursor-pointer hover:text-white transition-colors ml-2">
                                            <Play className="h-3 w-3 fill-current" />
                                            <span>Play All</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
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
                                                    channelAvatar={channel.ownerAvatarUrl || null}
                                                    views={video.viewsCount}
                                                    postedAt={timeAgo}
                                                    duration={video.durationSeconds}
                                                    watchedPercent={video.watchedPercent}
                                                    hideAvatar={true}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <EmptyChannelState isOwner={isOwner} setIsUploadOpen={setIsUploadOpen} type="videos" />
                        )
                    ) : activeTab === "VIDEOS" ? (
                        isVideosLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-[#3ea6ff] w-10 h-10" />
                            </div>
                        ) : hasVideos ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
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
                                            channelAvatar={channel.ownerAvatarUrl || null}
                                            views={video.viewsCount}
                                            postedAt={timeAgo}
                                            duration={video.durationSeconds}
                                            watchedPercent={video.watchedPercent}
                                            hideAvatar={true}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyChannelState isOwner={isOwner} setIsUploadOpen={setIsUploadOpen} type="videos" />
                        )
                    ) : activeTab === "PLAYLISTS" ? (
                        isPlaylistsLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-[#3ea6ff] w-10 h-10" />
                            </div>
                        ) : playlists && playlists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                                {playlists.map((playlist: PlaylistResponse) => (
                                    <PlaylistCard key={playlist.id} playlist={playlist} />
                                ))}
                            </div>
                        ) : (
                            <EmptyChannelState isOwner={isOwner} setIsUploadOpen={setIsUploadOpen} type="playlists" />
                        )
                    ) : activeTab === "LIVE" ? (
                        isStreamsLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-[#3ea6ff] w-10 h-10" />
                            </div>
                        ) : streams && streams.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                                {streams.map((stream: LiveStreamResponse) => (
                                    <StreamCard key={stream.id} stream={stream} />
                                ))}
                            </div>
                        ) : (
                            <EmptyChannelState isOwner={isOwner} setIsUploadOpen={setIsUploadOpen} type="streams" />
                        )
                    ) : (
                        <div className="flex items-center justify-center py-20 text-[#AAAAAA] text-lg">
                            This tab is currently empty.
                        </div>
                    )}
                </div>
            </div>

            <UploadVideoModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />
        </div>
    );
}

function EmptyChannelState({ isOwner, setIsUploadOpen, type }: { isOwner: boolean, setIsUploadOpen: (v: boolean) => void, type: "videos" | "playlists" | "streams" }) {
    if (type === "playlists") {
        return (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
                <div className="mt-10">
                    <h2 className="text-xl font-medium text-[#AAAAAA]">
                        {isOwner ? "You don't have any playlists yet." : "This channel has no public playlists."}
                    </h2>
                </div>
            </div>
        );
    }

    if (type === "streams") {
        return (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
                <div className="mt-10 flex flex-col items-center">
                    <Radio className="w-16 h-16 text-[#3F3F3F] mb-4" />
                    <h2 className="text-xl font-medium text-white mb-2">
                        {isOwner ? "You haven't streamed yet." : "This channel has no live streams."}
                    </h2>
                    {isOwner && (
                        <Link href="/studio">
                            <Button className="mt-4 bg-[#3ea6ff] hover:bg-[#6ebcff] text-black rounded-full px-6 h-10 font-medium transition-all cursor-pointer">
                                Go Live in Studio
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
            {isOwner ? (
                <>
                    <div className="mb-6 relative w-48 h-36">
                        <img
                            src="/empty-content-illustration.svg"
                            alt="No content"
                            className="w-full h-full object-contain opacity-80"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    </div>

                    <h2 className="text-xl font-medium mb-2 text-white">Create content on any device</h2>

                    <p className="text-[#AAAAAA] text-[14px] max-w-[420px] mb-8 leading-relaxed">
                        Upload and record at home or on the go.
                        Everything that you make public will appear here.
                    </p>
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black rounded-full px-6 h-10 font-medium transition-all cursor-pointer"
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
    );
}