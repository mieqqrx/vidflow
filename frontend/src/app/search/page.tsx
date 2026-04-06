"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    useSearchVideosQuery,
    useSearchChannelsQuery,
    useGetMyChannelQuery,
    useGetSubscriptionsQuery,
    useToggleSubscriptionMutation,
    useUnsubscribeFromChannelMutation,
    useToggleNotificationsMutation
} from "@/store/api";
import { Loader2, Filter, Check, Bell, X } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

import { Channel, SearchChannelDocument, Subscription } from "@/types";

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function FilterItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-start gap-3 text-[13px] hover:text-white transition-colors text-left cursor-pointer w-full ${active ? "text-white font-medium" : "text-[#AAAAAA]"}`}
        >
            <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-[2px]">
                {active && <Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
            </div>
            <span>{label}</span>
        </button>
    );
}

interface ChannelSearchItemProps {
    channel: SearchChannelDocument;
    myChannel?: Channel;
    subscriptions?: Subscription[];
    router: ReturnType<typeof useRouter>;
}

function ChannelSearchItem({ channel, myChannel, subscriptions, router }: ChannelSearchItemProps) {
    const [subscribe, { isLoading: isSubscribing }] = useToggleSubscriptionMutation();
    const [unsubscribe, { isLoading: isUnsubscribing }] = useUnsubscribeFromChannelMutation();
    const [toggleNotifications, { isLoading: isTogglingNotifications }] = useToggleNotificationsMutation();

    const currentSubscription = subscriptions?.find(
        (sub) => sub.channelId === channel.id
    );

    const isSubscribed = !!currentSubscription;
    const notificationsEnabled = currentSubscription?.notificationEnabled;
    const isToggling = isSubscribing || isUnsubscribing;

    const isMyChannel = myChannel?.id === channel.id;

    const handleSubscribeToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!myChannel) {
            router.push("/login");
            return;
        }

        try {
            if (isSubscribed) {
                await unsubscribe(channel.id).unwrap();
            } else {
                await subscribe(channel.id).unwrap();
            }
        } catch (error) {
            console.error("Failed to toggle subscription", error);
        }
    };

    const handleNotificationsToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await toggleNotifications(channel.id).unwrap();
        } catch (error) {
            console.error("Failed to toggle notifications", error);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-4 border-b border-[#3F3F3F]/30 pb-6 w-full md:px-12">
            <Link href={`/channel/${channel.id}`} className="w-[100px] h-[100px] md:w-[136px] md:h-[136px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#272727] cursor-pointer hover:opacity-90 transition-opacity">
                {channel.ownerAvatarUrl ? (
                    <img src={channel.ownerAvatarUrl} alt={channel.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-4xl text-white font-medium">{channel.name?.[0]?.toUpperCase()}</span>
                )}
            </Link>

            <div className="flex flex-col flex-1 text-center sm:text-left">
                <Link href={`/channel/${channel.id}`} className="text-lg md:text-[22px] font-medium text-white hover:text-white/80 transition-colors">
                    {channel.name}
                </Link>
                <div className="text-[#AAAAAA] text-[13px] mt-1 mb-2 flex flex-wrap justify-center sm:justify-start gap-1">
                    <span>{`@${channel.name.toLowerCase().replace(/\s/g, '')}`}</span>
                    <span>•</span>
                    <span>{(channel.subscribersCount || 0).toLocaleString()} subscribers</span>
                </div>
                <p className="text-[#AAAAAA] text-[13px] line-clamp-1 max-w-[600px] hidden sm:block">
                    {channel.description || "No description available."}
                </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                {isMyChannel ? (
                    <Link href={`/studio`} onClick={(e) => e.stopPropagation()}>
                        <Button className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full px-4 h-9 text-sm font-medium transition-colors">
                            Customize channel
                        </Button>
                    </Link>
                ) : (
                    isSubscribed ? (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleNotificationsToggle}
                                disabled={isTogglingNotifications}
                                className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full w-10 h-10 p-0 flex items-center justify-center transition-colors"
                            >
                                {isTogglingNotifications ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Bell className={`w-5 h-5 ${notificationsEnabled ? "fill-white" : "fill-transparent"}`} />
                                )}
                            </Button>

                            <Button
                                onClick={handleSubscribeToggle}
                                disabled={isToggling}
                                className="group cursor-pointer bg-[#272727] hover:bg-[#ff0000] text-white font-semibold text-sm px-4 h-10 rounded-full tracking-wide transition-all w-[130px]"
                            >
                                {isToggling ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    <>
                                        <span className="block group-hover:hidden">Subscribed</span>
                                        <span className="hidden group-hover:block">Unsubscribe</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleSubscribeToggle}
                            disabled={isToggling}
                            className="bg-white text-black hover:bg-gray-200 cursor-pointer font-semibold text-sm px-6 h-10 rounded-full tracking-wide transition-colors"
                        >
                            {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe"}
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}

type DurationFilter = "any" | "short" | "medium" | "long";

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState<number>(0);
    const [duration, setDuration] = useState<DurationFilter>("any");
    const [safeSearch, setSafeSearch] = useState<boolean>(false);

    const { data: myChannel } = useGetMyChannelQuery();

    const { data: subscriptions = [] } = useGetSubscriptionsQuery(undefined, {
        skip: !myChannel
    });

    let minDuration: number | undefined = undefined;
    let maxDuration: number | undefined = undefined;

    if (duration === "short") maxDuration = 240;
    else if (duration === "medium") { minDuration = 240; maxDuration = 1200; }
    else if (duration === "long") minDuration = 1200;

    const { data: videosData, isLoading: isVidLoading, isError: isVidError } = useSearchVideosQuery(
        { query, page: 1, pageSize: 20, sortBy, minDuration, maxDuration, safeSearch },
        { skip: !query }
    );

    const { data: channelsData, isLoading: isChanLoading } = useSearchChannelsQuery(
        { query, page: 1, pageSize: 3 },
        { skip: !query }
    );

    if (!query) {
        return <div className="p-8 text-center text-[#AAAAAA] pt-[100px]">Please enter a search term.</div>;
    }

    const channels = channelsData?.channels || [];
    const videos = videosData?.videos || [];
    const isLoading = isVidLoading || isChanLoading;
    const isError = isVidError;
    const noResults = !isLoading && channels.length === 0 && videos.length === 0;

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white pt-[72px] px-4 md:px-8 lg:px-12">
            <div className="max-w-[1096px] mx-auto py-6">

                <div className="flex items-center justify-end pb-4 mb-2 border-b border-[#3F3F3F]/50">
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors text-sm font-medium cursor-pointer hover:bg-[#272727] text-white"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {isFilterModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
                        onClick={() => setIsFilterModalOpen(false)}
                    >
                        <div
                            className="bg-[#212121] rounded-xl w-full max-w-[800px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#3F3F3F]/50">
                                <h2 className="text-[18px] font-bold text-white">Search filters</h2>

                                <button
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="p-2 hover:bg-[#3F3F3F] rounded-full transition-colors text-white cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 flex flex-col md:flex-row gap-8 md:gap-16 overflow-y-auto max-h-[70vh]">
                                <div className="flex-1 flex flex-col gap-6">
                                    <h4 className="text-[13px] font-medium text-white uppercase border-b border-[#3F3F3F] pb-3">
                                        Duration
                                    </h4>

                                    <div className="flex flex-col gap-5">
                                        <FilterItem label="Under 4 minutes" active={duration === "short"} onClick={() => setDuration(duration === "short" ? "any" : "short")} />
                                        <FilterItem label="4 - 20 minutes" active={duration === "medium"} onClick={() => setDuration(duration === "medium" ? "any" : "medium")} />
                                        <FilterItem label="Over 20 minutes" active={duration === "long"} onClick={() => setDuration(duration === "long" ? "any" : "long")} />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-6">
                                    <h4 className="text-[13px] font-medium text-white uppercase border-b border-[#3F3F3F] pb-3">
                                        Features
                                    </h4>

                                    <div className="flex flex-col gap-5">
                                        <FilterItem label="Safe Search" active={safeSearch} onClick={() => setSafeSearch(!safeSearch)} />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-6">
                                    <h4 className="text-[13px] font-medium text-white uppercase border-b border-[#3F3F3F] pb-3">
                                        Sort by
                                    </h4>

                                    <div className="flex flex-col gap-5">
                                        <FilterItem label="Relevance" active={sortBy === 0} onClick={() => setSortBy(0)} />
                                        <FilterItem label="Upload date" active={sortBy === 3} onClick={() => setSortBy(3)} />
                                        <FilterItem label="View count" active={sortBy === 1} onClick={() => setSortBy(1)} />
                                        <FilterItem label="Rating" active={sortBy === 2} onClick={() => setSortBy(2)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center mt-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
                    </div>
                )}

                {isError && (
                    <div className="text-center mt-20 text-red-500">Failed to load search results.</div>
                )}

                {noResults && (
                    <div className="text-center mt-20 text-[#AAAAAA]">
                        <h2 className="text-2xl font-bold mb-2">No results found</h2>
                        <p>Try different keywords or remove search filters.</p>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {channels.map((channel) => (
                        <ChannelSearchItem
                            key={channel.id}
                            channel={channel}
                            myChannel={myChannel}
                            subscriptions={subscriptions}
                            router={router}
                        />
                    ))}

                    <div className="flex flex-col gap-4 mt-4">
                        {videos.map((video) => (
                            <Link href={`/watch/${video.id}`} key={video.id} className="flex flex-col sm:flex-row gap-4 group cursor-pointer max-w-full">
                                <div className="relative w-full sm:w-[360px] sm:min-w-[360px] aspect-video bg-[#272727] rounded-xl overflow-hidden shrink-0">
                                    <img
                                        src={video.thumbnailUrl || "/placeholder.jpg"}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-xs font-medium text-white backdrop-blur-sm">
                                        {formatDuration(video.durationSeconds)}
                                    </div>
                                </div>

                                <div className="flex flex-col pt-1 w-full min-w-0 pr-4">
                                    <h3 className="text-lg md:text-xl font-medium text-white line-clamp-2 leading-tight group-hover:text-[#3ea6ff] transition-colors">
                                        {video.title}
                                    </h3>

                                    <div className="text-[#AAAAAA] text-[12px] md:text-xs mt-1 mb-3 flex items-center gap-1">
                                        <span>{video.viewsCount.toLocaleString()} views</span>
                                        <span className="text-[10px]">•</span>
                                        <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        {video.channelAvatarUrl ? (
                                            <img
                                                src={video.channelAvatarUrl}
                                                alt={video.channelName}
                                                className="w-6 h-6 rounded-full object-cover shrink-0 bg-[#272727]"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                                {video.channelName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-[#AAAAAA] text-[13px] md:text-xs hover:text-white transition-colors">
                                            {video.channelName}
                                        </span>
                                    </div>

                                    <p className="text-[#AAAAAA] text-xs line-clamp-2 hidden md:block">
                                        {video.description || "No description available."}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] pt-[72px]" />}>
            <SearchResultsContent />
        </Suspense>
    );
}