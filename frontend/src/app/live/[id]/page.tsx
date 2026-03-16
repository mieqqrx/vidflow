"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as signalR from "@microsoft/signalr";

import {
    useGetLiveStreamByIdQuery,
    useGetLiveStreamMessagesQuery,
    useGetMeQuery,
    useGetChannelByIdQuery,
    useGetSubscriptionsQuery,
    useToggleSubscriptionMutation
} from "@/store/api";
import { LiveStreamMessageDto, LiveStreamStatus } from "@/types/stream";
import LiveStreamPlayer from "@/components/Stream/LiveStreamPlayer";
import LiveStreamInfo from "@/components/Stream/LiveStreamInfo";
import LiveStreamChat from "@/components/Stream/LiveStreamChat";

export default function LiveStreamPage() {
    const params = useParams();
    const streamId = params.id as string;

    const { data: currentUser } = useGetMeQuery();
    const { data: initialMessages } = useGetLiveStreamMessagesQuery(streamId);

    const [pollInterval, setPollInterval] = useState(5000);
    const { data: stream, isLoading: isStreamLoading, refetch } = useGetLiveStreamByIdQuery(streamId, {
        pollingInterval: pollInterval
    });

    useEffect(() => {
        if (stream?.status === LiveStreamStatus.Ended && stream?.recordingUrl) {
            setPollInterval(0);
        }
    }, [stream?.status, stream?.recordingUrl]);

    useEffect(() => {
        if (stream?.status === LiveStreamStatus.Ended && stream?.recordingUrl) return;
        const intervalId = setInterval(() => refetch(), 3000);
        return () => clearInterval(intervalId);
    }, [stream?.status, stream?.recordingUrl, refetch]);

    const { data: channel } = useGetChannelByIdQuery(stream?.channelId || "", { skip: !stream?.channelId });
    const { data: subscriptions = [] } = useGetSubscriptionsQuery();
    const [toggleSubscribe, { isLoading: isTogglingSub }] = useToggleSubscriptionMutation();

    const isOwner = currentUser?.id === channel?.ownerId;
    const isSubscribed = subscriptions.some((subbedChannel: any) => subbedChannel.id === stream?.channelId);
    const isEnded = stream?.status === LiveStreamStatus.Ended;

    const [messages, setMessages] = useState<LiveStreamMessageDto[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [viewersCount, setViewersCount] = useState(0);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialMessages) setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        if (!streamId || isEnded) return;

        let isMounted = true;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const hubUrl = `${apiUrl.replace(/\/api\/?$/, '')}/hubs/livestream`;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => {
                    const token = localStorage.getItem("token");
                    return token ? token.replace(/^["']|["']$/g, '') : "";
                }
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build();

        setConnection(newConnection);

        const startSignalR = async () => {
            try {
                await newConnection.start();
                if (isMounted) {
                    newConnection.invoke("JoinStream", streamId);
                    newConnection.on("ViewersUpdated", (count: number) => setViewersCount(count));
                    newConnection.on("NewMessage", (message: LiveStreamMessageDto) => {
                        setMessages((prev) => [...prev, message]);
                    });
                }
            } catch (e: any) {}
        };

        startSignalR();

        return () => {
            isMounted = false;
            if (newConnection.state !== "Disconnected") newConnection.stop().catch(() => {});
        };
    }, [streamId, isEnded]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEnded) { toast.error("Chat is closed."); return; }
        if (!currentUser) { toast.error("You must be logged in to chat"); return; }
        if (!newMessage.trim() || !connection || connection.state !== "Connected") return;

        try {
            await connection.invoke("SendMessage", streamId, newMessage);
            setNewMessage("");
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    const handleSubscribeClick = async () => {
        if (!currentUser) { toast.error("Please sign in to subscribe"); return; }
        if (!stream?.channelId) return;
        try {
            await toggleSubscribe(stream.channelId).unwrap();
        } catch (error) {
            toast.error("Failed to update subscription");
        }
    };

    if (isStreamLoading && !stream) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>;
    if (!stream) return <div className="min-h-screen bg-[#0F0F0F] pt-[100px] text-center text-white">Stream not found.</div>;

    return (
        <div className="min-h-[calc(100vh-72px)] bg-[#0F0F0F] text-white pt-4 md:pt-[80px] px-4 md:px-6 lg:px-8 pb-10">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0 flex flex-col w-full">
                    <LiveStreamPlayer
                        stream={stream}
                        viewersCount={viewersCount}
                    />

                    <LiveStreamInfo
                        stream={stream}
                        isOwner={isOwner}
                        isSubscribed={isSubscribed}
                        isTogglingSub={isTogglingSub}
                        handleSubscribeClick={handleSubscribeClick}
                    />
                </div>

                <LiveStreamChat
                    stream={stream}
                    messages={messages}
                    currentUser={currentUser}
                    isEnded={isEnded}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleSendMessage={handleSendMessage}
                    chatContainerRef={chatContainerRef}
                />
            </div>
        </div>
    );
}