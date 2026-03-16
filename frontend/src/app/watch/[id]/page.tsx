"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ThumbsUp, ThumbsDown, Share2, Scissors,
    MoreHorizontal, Loader2, Bell, ListPlus, Flag
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SecondaryVideoCard from "@/components/Thumbnail/SecondaryVideoCard";
import CommentSection from "@/components/Comment/CommentSection";
import VideoPlayerUI from "@/components/VideoPlayer/VideoPlayerUI";
import SaveToPlaylistModal from "@/components/Playlist/SaveToPlaylistModal";
import PlaylistSidebarPanel from "@/components/Playlist/PlaylistSidebarPanel";
import ReportVideoModal from "@/components/Report/ReportVideoModal";

import {
    useGetMeQuery,
    useGetVideoByIdQuery,
    useGetSimilarVideosQuery, // <-- Подключили новый хук для похожих видео
    useGetSubscriptionsQuery,
    useUnsubscribeFromChannelMutation,
    useToggleNotificationsMutation,
    useToggleSubscriptionMutation,
    useToggleLikeMutation,
    useToggleDislikeMutation,
    useRecordViewMutation,
    useGetLikeStatusQuery,
    useGetDislikeStatusQuery,
    useGetMyChannelQuery,
    useGetChannelByIdQuery,
    useGetMyPlaylistsQuery,
    useGetPlaylistByIdQuery,
    useUpdateUserSettingsMutation,
    useGetVideoPositionQuery,
    useUpdateWatchPositionMutation
} from "@/store/api";

function WatchContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const videoId = params.id as string;
    const listParam = searchParams.get("list");

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const { data: currentUser } = useGetMeQuery();
    const [updateUserSettings] = useUpdateUserSettingsMutation();

    const [localAutoplay, setLocalAutoplay] = useState(true);

    useEffect(() => {
        if (currentUser && currentUser.autoplayEnabled !== undefined) {
            setLocalAutoplay(currentUser.autoplayEnabled);
        }
    }, [currentUser]);

    const handleToggleAutoplay = async () => {
        if (!currentUser) {
            toast.info("Sign in to save your Autoplay settings");
            return;
        }

        const newAutoplayState = !localAutoplay;
        setLocalAutoplay(newAutoplayState);

        try {
            await updateUserSettings({ autoplayEnabled: newAutoplayState }).unwrap();
            toast.success(`Autoplay is now ${newAutoplayState ? "ON" : "OFF"}`);
        } catch (error) {
            setLocalAutoplay(!newAutoplayState);
            toast.error("Failed to save Autoplay setting");
        }
    };

    const { data: positionData, isLoading: isPositionLoading } = useGetVideoPositionQuery(videoId, {
        skip: !currentUser
    });

    const [updatePosition] = useUpdateWatchPositionMutation();

    const handleSavePosition = (time: number) => {
        if (currentUser) {
            updatePosition({ videoId, positionSeconds: time });
        }
    };

    const { data: video, isLoading: isVideoLoading, isError: isVideoError } = useGetVideoByIdQuery(videoId);

    const { data: channelData } = useGetChannelByIdQuery(video?.channelId || "", {
        skip: !video?.channelId
    });

    const { data: myChannel } = useGetMyChannelQuery();
    const isOwner = myChannel?.id === video?.channelId;

    // === ПОЛУЧАЕМ ПОХОЖИЕ ВИДЕО ИЗ ELASTICSEARCH ===
    const { data: similarVideosData } = useGetSimilarVideosQuery(
        { videoId, count: 15 },
        { skip: !videoId }
    );
    const relatedVideos = similarVideosData || [];

    const { data: subscriptions = [] } = useGetSubscriptionsQuery();

    const { data: likeData } = useGetLikeStatusQuery(videoId, { skip: !videoId });
    const { data: dislikeData } = useGetDislikeStatusQuery(videoId, { skip: !videoId });

    const { data: myPlaylists } = useGetMyPlaylistsQuery(undefined, {
        skip: !listParam || (listParam !== "WL" && listParam !== "LL")
    });

    const targetPlaylistId = useMemo(() => {
        if (!listParam) return null;
        if (listParam === "WL") return myPlaylists?.find(p => p.type === 2)?.id || null;
        if (listParam === "LL") return myPlaylists?.find(p => p.type === 1)?.id || null;
        return listParam;
    }, [listParam, myPlaylists]);

    const { data: playlistData } = useGetPlaylistByIdQuery(targetPlaylistId || "", {
        skip: !targetPlaylistId
    });

    const handleVideoEnded = () => {
        if (playlistData && listParam) {
            const currentIndex = playlistData.videos.findIndex((v: any) => v.videoId === videoId);

            if (currentIndex !== -1 && currentIndex < playlistData.videos.length - 1) {
                const nextVideoId = playlistData.videos[currentIndex + 1].videoId;
                router.push(`/watch/${nextVideoId}?list=${listParam}`);
                return;
            }
        }

        if (localAutoplay && relatedVideos.length > 0) {
            router.push(`/watch/${relatedVideos[0].id}`);
        }
    };

    const isLiked = likeData?.isLiked || false;
    const isDisliked = dislikeData?.isDisliked || false;

    const [subscribe, { isLoading: isSubscribing }] = useToggleSubscriptionMutation();
    const [unsubscribe, { isLoading: isUnsubscribing }] = useUnsubscribeFromChannelMutation();
    const [toggleNotifications, { isLoading: isTogglingNotifications }] = useToggleNotificationsMutation();

    const [toggleLike] = useToggleLikeMutation();
    const [toggleDislike] = useToggleDislikeMutation();
    const [recordView] = useRecordViewMutation();

    useEffect(() => {
        if (videoId) {
            const timer = setTimeout(() => {
                recordView(videoId);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [videoId, recordView]);

    if (isVideoLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-[72px]">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (isVideoError || !video) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white pt-[72px]">
                <h1 className="text-2xl font-bold mb-2">Video not found</h1>
                <p className="text-[#AAAAAA]">This video is unavailable or has been removed.</p>

                <Link href="/">
                    <Button className="mt-6 bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium">
                        Go Home
                    </Button>
                </Link>
            </div>
        );
    }

    const handleLikeToggle = async () => {
        try {
            await toggleLike(videoId).unwrap();
        } catch (error) {
            console.error("Failed to like video", error);
        }
    };

    const handleDislikeToggle = async () => {
        try {
            await toggleDislike(videoId).unwrap();
        } catch (error) {
            console.error("Failed to dislike video", error);
        }
    };

    const currentSubscription = subscriptions.find((sub: any) => sub.channelId === video.channelId);
    const isSubscribed = !!currentSubscription;
    const notificationsEnabled = currentSubscription?.notificationEnabled;
    const isToggling = isSubscribing || isUnsubscribing;

    const handleSubscribeToggle = async () => {
        try {
            if (isSubscribed) {
                await unsubscribe(video.channelId).unwrap();
            } else {
                await subscribe(video.channelId).unwrap();
            }
        } catch (error) {
            console.error("Failed to toggle subscription", error);
        }
    };

    const handleNotificationsToggle = async () => {
        try {
            await toggleNotifications(video.channelId).unwrap();
        } catch (error) {
            console.error("Failed to toggle notifications", error);
        }
    };

    const firstLetter = video.channelName?.[0]?.toUpperCase() || "C";
    const timeAgo = video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : "Recently";
    const formattedViews = video.viewsCount?.toLocaleString() || "0";

    const formattedSubscribers = channelData?.subscribersCount?.toLocaleString() || "0";
    const avatarUrl = channelData?.avatarUrl || undefined;

    const formattedLikes = video.likesCount > 0 ? video.likesCount.toLocaleString() : "Like";

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white pt-[72px] px-4 md:px-6 lg:px-8 xl:px-6 relative">
            <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-6">

                <div className="flex-1 min-w-0">

                    {currentUser && isPositionLoading ? (
                        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-[#3F3F3F] shadow-lg">
                            <Loader2 className="w-12 h-12 text-[#3ea6ff] animate-spin" />
                        </div>
                    ) : (
                        <VideoPlayerUI
                            videoUrl={video.videoUrl}
                            thumbnail={video.thumbnailUrl}
                            onEnded={handleVideoEnded}
                            autoplayEnabled={localAutoplay}
                            onToggleAutoplay={handleToggleAutoplay}
                            initialTime={positionData?.lastPositionSeconds || 0}
                            onSavePosition={handleSavePosition}
                        />
                    )}

                    <h1 className="text-[20px] md:text-[22px] font-bold mt-4">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
                        <div className="flex items-center gap-3">
                            <Link href={`/channel/${video.channelId}`}>
                                <Avatar className="h-10 w-10 cursor-pointer">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="bg-purple-600 text-white">{firstLetter}</AvatarFallback>
                                </Avatar>
                            </Link>

                            <div className="flex flex-col mr-4">
                                <Link href={`/channel/${video.channelId}`}>
                                    <span className="font-bold text-[16px] cursor-pointer hover:text-gray-300 transition-colors">
                                        {video.channelName || "Unknown Channel"}
                                    </span>
                                </Link>

                                <span className="text-[12px] text-[#AAAAAA]">
                                    {formattedSubscribers} subscribers
                                </span>
                            </div>

                            {isOwner ? (
                                <Link href="/studio">
                                    <Button className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white font-medium rounded-full px-5 h-9 text-sm transition-colors">
                                        Manage Videos
                                    </Button>
                                </Link>
                            ) : isSubscribed ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleNotificationsToggle}
                                        disabled={isTogglingNotifications}
                                        className="cursor-pointer bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full w-9 h-9 p-0 flex items-center justify-center transition-colors"
                                    >
                                        {isTogglingNotifications ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Bell className={`w-4 h-4 ${notificationsEnabled ? "fill-white" : "fill-transparent"}`} />
                                        )}
                                    </Button>

                                    <Button
                                        onClick={handleSubscribeToggle}
                                        disabled={isToggling}
                                        className="group cursor-pointer bg-[#272727] hover:bg-[#ff0000] text-white font-medium rounded-full px-4 h-9 text-sm transition-all w-[115px]"
                                    >
                                        {isToggling ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
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
                                    className="cursor-pointer bg-white hover:bg-[#d9d9d9] text-black font-medium rounded-full px-5 h-9 text-sm transition-colors"
                                >
                                    {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                            <div className="flex items-center bg-[#272727] rounded-full h-9 shrink-0 overflow-hidden">
                                <button
                                    onClick={handleLikeToggle}
                                    className="flex items-center gap-2 px-4 h-full hover:bg-[#3F3F3F] rounded-l-full border-r border-[#3F3F3F] transition-colors cursor-pointer group"
                                >
                                    <motion.div
                                        key={isLiked ? "liked" : "unliked"}
                                        initial={{ scale: 1 }}
                                        animate={isLiked ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : { scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ThumbsUp
                                            className={`w-[18px] h-[18px] transition-colors duration-200 ${isLiked ? "fill-white text-white" : "text-white group-hover:text-gray-200"}`}
                                        />
                                    </motion.div>
                                    <span className="text-sm font-medium">{formattedLikes}</span>
                                </button>

                                <button
                                    onClick={handleDislikeToggle}
                                    className="cursor-pointer px-4 h-full hover:bg-[#3F3F3F] rounded-r-full transition-colors relative group"
                                >
                                    <motion.div
                                        key={isDisliked ? "disliked" : "undisliked"}
                                        initial={{ scale: 1 }}
                                        animate={isDisliked ? { scale: [1, 1.4, 1], rotate: [0, 15, 0] } : { scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ThumbsDown
                                            className={`w-[18px] h-[18px] transition-colors duration-200 ${isDisliked ? "fill-white text-white" : "text-white group-hover:text-gray-200"}`}
                                        />
                                    </motion.div>
                                </button>
                            </div>

                            <Button variant="ghost" className="cursor-pointer bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-full h-9 gap-2 px-4 shrink-0 transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => setIsPlaylistModalOpen(true)}
                                className="cursor-pointer bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-full h-9 gap-2 px-4 shrink-0 transition-colors"
                            >
                                <ListPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Save</span>
                            </Button>

                            <Button variant="ghost" className="cursor-pointer bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-full h-9 gap-2 px-4 hidden sm:flex shrink-0 transition-colors">
                                <Scissors className="w-4 h-4" />
                                Clip
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="cursor-pointer bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-full h-9 w-9 shrink-0 transition-colors outline-none">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#282828] border-[#3f3f3f] text-white rounded-xl shadow-2xl p-2 mt-2 z-50">
                                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] rounded-lg text-[14px] py-2.5">
                                        <Flag className="w-4 h-4 mr-3 text-[#AAAAAA]" />
                                        <span>Report</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                    </div>

                    <div
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="bg-[#272727] rounded-xl p-3 mt-4 text-sm cursor-pointer hover:bg-[#3F3F3F] transition-colors"
                    >
                        <div className="font-bold mb-1">{formattedViews} views • {timeAgo}</div>

                        <p className={`text-white whitespace-pre-wrap leading-relaxed ${isDescriptionExpanded ? "" : "line-clamp-2"}`}>
                            {video.description || "No description provided."}
                        </p>

                        <span className="font-bold mt-2 block cursor-pointer">
                            {isDescriptionExpanded ? "Show less" : "Show more"}
                        </span>
                    </div>

                    <CommentSection videoId={videoId}/>
                </div>

                <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-2 pb-10">

                    {targetPlaylistId && (
                        <PlaylistSidebarPanel
                            playlistId={targetPlaylistId}
                            currentVideoId={videoId}
                        />
                    )}

                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                        <Button variant="secondary" className="bg-white text-black hover:bg-[#d9d9d9] h-8 rounded-lg text-sm font-semibold shrink-0">
                            All
                        </Button>

                        <Button variant="ghost" className="bg-[#272727] text-white hover:bg-[#3F3F3F] h-8 rounded-lg text-sm font-medium shrink-0">
                            From {video.channelName || "this channel"}
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {relatedVideos.map((vid) => {
                            const relatedTimeAgo = vid.createdAt
                                ? formatDistanceToNow(new Date(vid.createdAt), { addSuffix: true })
                                : "Recently";

                            return (
                                <SecondaryVideoCard
                                    key={vid.id}
                                    id={vid.id}
                                    thumbnail={vid.thumbnailUrl}
                                    duration={vid.durationSeconds}
                                    title={vid.title}
                                    channelId={vid.channelId}
                                    channelName={vid.channelName || "Unknown Channel"}
                                    views={vid.viewsCount}
                                    postedAt={relatedTimeAgo}
                                />
                            );
                        })}

                        {relatedVideos.length === 0 && (
                            <div className="text-center text-[#AAAAAA] mt-10">
                                No related videos found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SaveToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                videoId={videoId}
            />

            <ReportVideoModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                videoId={videoId}
            />
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-[72px]"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>}>
            <WatchContent />
        </Suspense>
    );
}