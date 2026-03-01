"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel } from "@/types";
import ChannelTabs from "./ChannelTabs";
import { Loader2, Bell } from "lucide-react";

import {
    useGetSubscriptionsQuery,
    useToggleSubscriptionMutation,
    useUnsubscribeFromChannelMutation,
    useToggleNotificationsMutation
} from "@/store/api/apiSlice";

interface ChannelHeaderProps {
    channel: Channel;
    isOwner: boolean;
}

export default function ChannelHeader({ channel, isOwner }: ChannelHeaderProps) {
    const firstLetter = channel.name?.[0]?.toUpperCase() || "C";
    const handle = `@${channel.name.toLowerCase().replace(/\s+/g, '')}`;

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
                        <AvatarImage src={channel.avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-purple-600">{firstLetter}</AvatarFallback>
                    </Avatar>

                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{channel.name}</h1>

                        <div className="text-[#AAAAAA] text-sm flex flex-col items-center md:items-start">
                            <span>{handle} • {channel.subscribersCount} subscribers • 0 videos</span>

                            <div className="flex items-center gap-1 mt-1 cursor-pointer hover:text-white transition-colors">
                                <span className="text-[#AAAAAA]">More about this channel</span>
                                <span className="font-bold">...more</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:ml-auto flex flex-wrap justify-center gap-2 mt-4 md:mt-0">
                        {isOwner ? (
                            <>
                                <Button className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full px-4 h-9 text-sm font-medium transition-colors">
                                    Customize channel
                                </Button>

                                <Button className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full px-4 h-9 text-sm font-medium transition-colors">
                                    Manage videos
                                </Button>
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

            <ChannelTabs />
        </div>
    );
}