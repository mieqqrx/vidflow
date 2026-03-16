"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
    Play, ThumbsUp, ThumbsDown, MessageSquare,
    Share2, MoreVertical, Volume2, VolumeX, X, Send, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Video, Comment } from "@/types";

import {
    useToggleLikeMutation,
    useToggleDislikeMutation,
    useToggleSubscriptionMutation,
    useGetVideoCommentsQuery,
    useCreateCommentMutation,
    useGetMyChannelQuery,
    useRecordViewMutation,
    useGetLikeStatusQuery,
    useGetDislikeStatusQuery
} from "@/store/api";
import { useVolumeControl } from "@/hooks/useVolumeControl";
import CommentItem from "@/components/Comment/CommentItem";

import { fixUrl } from "@/utils/fixUrl";

interface ShortPlayerProps {
    short: Video;
    isActive: boolean;
}

export default function ShortPlayer({ short, isActive }: ShortPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastRecordedId = useRef<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [commentText, setCommentText] = useState("");

    const { volume, isMuted, changeVolume, toggleMute } = useVolumeControl(videoRef);

    const [interactionState, setInteractionState] = useState({
        isLiked: short.isLiked || false,
        isDisliked: short.isDisliked || false,
        likesCount: short.likesCount || 0,
    });

    const { data: myChannel } = useGetMyChannelQuery();
    const [recordView] = useRecordViewMutation();
    const [toggleLike] = useToggleLikeMutation();
    const [toggleDislike] = useToggleDislikeMutation();
    const [toggleSub] = useToggleSubscriptionMutation();
    const [createComment, { isLoading: isSubmittingComment }] = useCreateCommentMutation();

    const { data: likeData } = useGetLikeStatusQuery(short.id, { skip: !isActive });
    const { data: dislikeData } = useGetDislikeStatusQuery(short.id, { skip: !isActive });

    const { data: comments = [], isLoading: isCommentsLoading } = useGetVideoCommentsQuery(short.id, {
        skip: !isCommentsOpen
    });

    const videoUrl = short.videoUrl
        ? fixUrl(short.videoUrl)
        : `${process.env.NEXT_PUBLIC_MINIO_EXTERNAL_URL || 'http://26.192.139.137:9000'}/videos/${short.id}/short.mp4`;

    const thumbnailUrl = fixUrl(short.thumbnailUrl);
    const avatarUrl = fixUrl(short.channelAvatarUrl);

    const isMyChannel = myChannel?.id === short.channelId;

    useEffect(() => {
        setInteractionState({
            isLiked: short.isLiked || false,
            isDisliked: short.isDisliked || false,
            likesCount: short.likesCount || 0,
        });
        setIsCommentsOpen(false);
    }, [short.id]);

    useEffect(() => {
        if (likeData !== undefined) {
            setInteractionState(prev => ({ ...prev, isLiked: likeData.isLiked }));
        }
    }, [likeData]);

    useEffect(() => {
        if (dislikeData !== undefined) {
            setInteractionState(prev => ({ ...prev, isDisliked: dislikeData.isDisliked }));
        }
    }, [dislikeData]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isActive && !isCommentsOpen) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive, isCommentsOpen]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            if (total > 0) setProgress((current / total) * 100);

            if (isActive && current > 2 && lastRecordedId.current !== short.id) {
                lastRecordedId.current = short.id;
                recordView(short.id).unwrap().catch((err) => {
                    console.error("History record error:", err);
                    lastRecordedId.current = null;
                });
            }
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasLiked = interactionState.isLiked;
        setInteractionState(prev => ({
            isLiked: !prev.isLiked,
            isDisliked: false,
            likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        }));
        try {
            await toggleLike(short.id).unwrap();
        } catch {
            setInteractionState(prev => ({
                ...prev, isLiked: wasLiked,
                likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1
            }));
            toast.error("Failed to like video");
        }
    };

    const handleDislike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const wasDisliked = interactionState.isDisliked;
        const wasLiked = interactionState.isLiked;
        setInteractionState(prev => ({
            isLiked: false,
            isDisliked: !prev.isDisliked,
            likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount,
        }));
        try {
            await toggleDislike(short.id).unwrap();
        } catch {
            setInteractionState(prev => ({
                ...prev,
                isDisliked: wasDisliked,
                isLiked: wasLiked,
                likesCount: wasLiked && !prev.isLiked ? prev.likesCount + 1 : prev.likesCount
            }));
            toast.error("Failed to dislike video");
        }
    };

    const handleSubscribe = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleSub(short.channelId).unwrap();
            toast.success(`Subscription status updated!`);
        } catch {
            toast.error("Failed to update subscription");
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = `${window.location.origin}/shorts/${short.id}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard!");
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            await createComment({ videoId: short.id, text: commentText }).unwrap();
            setCommentText("");
            toast.success("Comment added!");
        } catch {
            toast.error("Failed to post comment");
        }
    };

    const formatCount = (count: number) => {
        if (!count) return "0";
        if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
        if (count >= 1000) return (count / 1000).toFixed(1) + "K";
        return count.toString();
    };

    return (
        <div className="flex justify-center w-full h-full max-h-[100vh] sm:h-[calc(100vh-100px)] sm:max-h-[850px]">
            <div className="flex h-full w-full sm:w-auto relative justify-center">

                <div className="relative w-full sm:w-[450px] h-full bg-black sm:rounded-2xl overflow-hidden shadow-2xl group shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl"
                        style={{ backgroundImage: `url(${thumbnailUrl || '/placeholder.jpg'})` }}
                    />

                    <video
                        ref={videoRef}
                        src={videoUrl}
                        poster={thumbnailUrl}
                        className="relative w-full h-full object-contain cursor-pointer z-10"
                        loop
                        playsInline
                        onClick={togglePlay}
                        onTimeUpdate={handleTimeUpdate}
                    />

                    {!isPlaying && !isCommentsOpen && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/10">
                            <div className="bg-black/50 p-5 rounded-full backdrop-blur-md">
                                <Play className="w-12 h-12 text-white fill-white translate-x-1" />
                            </div>
                        </div>
                    )}

                    <div
                        className="absolute top-6 right-4 z-30 flex items-center group/vol rounded-full pr-1 hover:pr-4 transition-all duration-300 hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={toggleMute} className="p-2.5 text-white rounded-full transition-colors outline-none drop-shadow-lg">
                            {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                        <div className="w-0 overflow-hidden transition-all duration-300 group-hover/vol:w-20 flex items-center opacity-0 group-hover/vol:opacity-100">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/50 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 pt-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 flex flex-col justify-end pointer-events-none">
                        <div className="pr-16 sm:pr-4 w-full">
                            <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                                <Link href={`/channel/${short.channelId}`}>
                                    <Avatar className="w-10 h-10 border-2 border-white/20 drop-shadow-lg">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="bg-purple-600 text-[12px]">{short.channelName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <Link href={`/channel/${short.channelId}`} className="font-semibold text-white text-[15px] hover:text-[#aaaaaa] transition-colors drop-shadow-lg">
                                    @{short.channelName}
                                </Link>

                                {!isMyChannel && (
                                    <button
                                        onClick={handleSubscribe}
                                        className="bg-white text-black text-[13px] font-bold px-4 py-1.5 rounded-full ml-1 hover:bg-gray-200 transition-colors drop-shadow-md"
                                    >
                                        Subscribe
                                    </button>
                                )}
                            </div>
                            <h2 className="text-white text-[15px] font-medium line-clamp-2 drop-shadow-lg pointer-events-auto">
                                {short.title}
                            </h2>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-40">
                        <div
                            className="h-full bg-[#CC0000] transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 bg-[#212121] z-50 rounded-t-2xl flex flex-col transition-transform duration-300 ease-in-out ${isCommentsOpen ? "translate-y-0" : "translate-y-full"} h-[70%]`}>
                        <div className="flex items-center justify-between p-4 border-b border-[#3f3f3f]">
                            <h3 className="text-white font-bold">Comments <span className="text-[#aaaaaa] font-normal text-sm ml-1">{short.commentsCount}</span></h3>
                            <button onClick={() => setIsCommentsOpen(false)} className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 no-scrollbar">
                            {isCommentsLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#3ea6ff]" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {comments.map((comment: Comment) => (
                                        <CommentItem key={comment.id} {...comment} videoId={short.id} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="p-3 border-t border-[#3f3f3f] bg-[#212121] flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border-b border-[#3f3f3f] text-white px-2 py-1.5 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-[#aaaaaa]"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button type="submit" disabled={!commentText.trim() || isSubmittingComment} className="p-2 text-[#3ea6ff] disabled:text-[#3f3f3f] transition-colors">
                                {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="absolute bottom-4 right-3 sm:static sm:ml-5 sm:pb-4 flex flex-col items-center justify-end gap-4 z-30 shrink-0">
                    <button onClick={handleLike} className="flex flex-col items-center gap-1 group outline-none">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 sm:bg-[#272727] group-hover:bg-black/60 sm:group-hover:bg-[#3f3f3f] transition-colors backdrop-blur-sm sm:backdrop-blur-none">
                            <ThumbsUp className={`w-6 h-6 transition-all ${interactionState.isLiked ? 'text-white fill-white' : 'text-white fill-transparent'}`} />
                        </div>
                        <span className="text-white text-[13px] font-medium drop-shadow-md sm:drop-shadow-none">{formatCount(interactionState.likesCount)}</span>
                    </button>

                    <button onClick={handleDislike} className="flex flex-col items-center gap-1 group outline-none">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 sm:bg-[#272727] group-hover:bg-black/60 sm:group-hover:bg-[#3f3f3f] transition-colors backdrop-blur-sm sm:backdrop-blur-none">
                            <ThumbsDown className={`w-6 h-6 transition-all ${interactionState.isDisliked ? 'text-white fill-white' : 'text-white fill-transparent'}`} />
                        </div>
                        <span className="text-white text-[13px] font-medium drop-shadow-md sm:drop-shadow-none">Dislike</span>
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }} className="flex flex-col items-center gap-1 group outline-none">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 sm:bg-[#272727] group-hover:bg-black/60 sm:group-hover:bg-[#3f3f3f] transition-colors backdrop-blur-sm sm:backdrop-blur-none">
                            <MessageSquare className="w-6 h-6 text-white fill-transparent group-hover:fill-white transition-all" />
                        </div>
                        <span className="text-white text-[13px] font-medium drop-shadow-md sm:drop-shadow-none">{formatCount(short.commentsCount)}</span>
                    </button>

                    <button onClick={handleShare} className="flex flex-col items-center gap-1 group outline-none">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 sm:bg-[#272727] group-hover:bg-black/60 sm:group-hover:bg-[#3f3f3f] transition-colors backdrop-blur-sm sm:backdrop-blur-none">
                            <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-[13px] font-medium drop-shadow-md sm:drop-shadow-none">Share</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 group outline-none mt-1">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 sm:bg-[#272727] group-hover:bg-black/60 sm:group-hover:bg-[#3f3f3f] transition-colors backdrop-blur-sm sm:backdrop-blur-none">
                            <MoreVertical className="w-6 h-6 text-white" />
                        </div>
                    </button>

                    <div className="mt-2 w-[40px] h-[40px] rounded-md overflow-hidden border-2 border-white/80 animate-[spin_8s_linear_infinite] shadow-lg">
                        <img src={avatarUrl || "/placeholder.jpg"} className="w-full h-full object-cover" alt="Audio" />
                    </div>
                </div>
            </div>
        </div>
    );
}