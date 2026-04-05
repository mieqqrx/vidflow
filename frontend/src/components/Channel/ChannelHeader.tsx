"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel, Video } from "@/types";
import ChannelTabs from "./ChannelTabs";
import {
    Loader2, Bell, X, Globe, Info,
    Users, PlaySquare, TrendingUp, Share2
} from "lucide-react";
import Link from "next/link";
import EditChannelModal from "./EditChannelModal";
import { format } from "date-fns";

import { toast } from "sonner";
import {
    useGetSubscriptionsQuery,
    useToggleNotificationsMutation, useToggleSubscriptionMutation, useUnsubscribeFromChannelMutation
} from "@/store/api";

interface ChannelHeaderProps {
    channel: Channel;
    isOwner: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    videos: Video[];
}

export default function ChannelHeader({ channel, isOwner, activeTab, setActiveTab, videos }: ChannelHeaderProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    const firstLetter = channel.name?.[0]?.toUpperCase() || "C";
    const handle = channel.ownerUsername ? `@${channel.ownerUsername}` : `@${channel.name.toLowerCase().replace(/\s+/g, '')}`;

    const { data: subscriptions = [] } = useGetSubscriptionsQuery();

    const [subscribe, { isLoading: isSubscribing }] = useToggleSubscriptionMutation();
    const [unsubscribe, { isLoading: isUnsubscribing }] = useUnsubscribeFromChannelMutation();
    const [toggleNotifications, { isLoading: isTogglingNotifications }] = useToggleNotificationsMutation();

    const currentSubscription = subscriptions.find((sub: any) => sub.channelId === channel.id);
    const isSubscribed = !!currentSubscription;
    const notificationsEnabled = currentSubscription?.notificationEnabled;
    const isToggling = isSubscribing || isUnsubscribing;

    const handleSubscribeToggle = async () => {
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

    const handleNotificationsToggle = async () => {
        try {
            await toggleNotifications(channel.id).unwrap();
        } catch (error) {
            console.error("Failed to toggle notifications", error);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/channel/${channel.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Channel link copied to clipboard");
    };

    const totalViews = videos?.reduce((sum, video) => sum + (video.viewsCount || 0), 0) || 0;
    const videoCount = videos?.length || 0;
    const joinDate = channel.createdAt ? format(new Date(channel.createdAt), "MMM d, yyyy") : "Unknown";
    const channelUrl = typeof window !== "undefined" ? `${window.location.host}/${handle}` : handle;

    return (
        <div className="w-full bg-[#0F0F0F] text-white">
            <div
                className="w-full h-40 md:h-[240px] bg-cover bg-center"
                style={{
                    backgroundImage: channel.bannerUrl
                        ? `url(${channel.bannerUrl})`
                        : "linear-gradient(to right, #FFD700, #FF8C00, #76EE00)"
                }}
            ></div>

            <div className="px-6 md:px-16 py-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 shrink-0">
                        <AvatarImage
                            src={(channel.ownerAvatarUrl || channel.avatarUrl) ? `${channel.ownerAvatarUrl || channel.avatarUrl}?t=${new Date().getTime()}` : undefined}
                            className="object-cover"
                        />

                        <AvatarFallback className="bg-purple-600 text-3xl">{firstLetter}</AvatarFallback>
                    </Avatar>

                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{channel.name}</h1>

                        <div className="text-[#AAAAAA] text-sm flex flex-col items-center md:items-start">
                            <span>{handle} • {channel.subscribersCount} subscribers • {videoCount} videos</span>

                            <div
                                className="flex items-center gap-1 mt-1 cursor-pointer hover:text-white transition-colors group"
                                onClick={() => setIsAboutModalOpen(true)}
                            >
                                <span className="text-[#AAAAAA] line-clamp-1 max-w-[400px]">
                                    {channel.description || "More about this channel"}
                                </span>

                                <span className="font-bold group-hover:text-white">...more</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:ml-auto flex flex-wrap justify-center gap-2 mt-4 md:mt-0">
                        {isOwner ? (
                            <>
                                <Button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full px-4 h-9 text-sm font-medium transition-colors"
                                >
                                    Customize channel
                                </Button>

                                <Link href="/studio">
                                    <Button className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full px-4 h-9 text-sm font-medium transition-colors">
                                        Manage videos
                                    </Button>
                                </Link>
                            </>
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
            </div>

            <ChannelTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <EditChannelModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                channel={channel}
                videos={videos}
            />

            {isAboutModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setIsAboutModalOpen(false)}
                >
                    <div
                        className="bg-[#212121] rounded-xl w-full max-w-[500px] shadow-2xl border border-[#3F3F3F] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 pb-4">
                            <h2 className="text-[20px] font-bold text-white">About {channel.name}</h2>

                            <button
                                onClick={() => setIsAboutModalOpen(false)}
                                className="p-2 hover:bg-[#3F3F3F] rounded-full transition-colors text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 pt-0 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">

                            {channel.description && (
                                <p className="text-white text-[14px] whitespace-pre-wrap leading-relaxed">
                                    {channel.description}
                                </p>
                            )}

                            <div className="flex flex-col gap-4 text-white mt-2">
                                <h3 className="text-[18px] font-bold mb-1">Channel details</h3>

                                <div className="flex items-center gap-4 text-[14px]">
                                    <Globe className="w-5 h-5 text-white shrink-0" />

                                    <a href={`/channel/${channel.id}`} className="hover:text-[#3ea6ff] transition-colors truncate">
                                        {channelUrl}
                                    </a>
                                </div>

                                <div className="flex items-center gap-4 text-[14px]">
                                    <Info className="w-5 h-5 text-white shrink-0" />
                                    <span>Joined {joinDate}</span>
                                </div>

                                <div className="flex items-center gap-4 text-[14px]">
                                    <Users className="w-5 h-5 text-white shrink-0" />
                                    <span>{channel.subscribersCount.toLocaleString()} subscribers</span>
                                </div>

                                <div className="flex items-center gap-4 text-[14px]">
                                    <PlaySquare className="w-5 h-5 text-white shrink-0" />
                                    <span>{videoCount.toLocaleString()} videos</span>
                                </div>

                                <div className="flex items-center gap-4 text-[14px]">
                                    <TrendingUp className="w-5 h-5 text-white shrink-0" />
                                    <span>{totalViews.toLocaleString()} views</span>
                                </div>

                                <Button
                                    onClick={handleShare}
                                    className="w-fit mt-4 rounded-full bg-[#272727] hover:bg-[#3F3F3F] text-white flex items-center gap-2 h-10 px-5 transition-colors"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span className="font-semibold text-sm">Share channel</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}