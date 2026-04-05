"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash2 } from "lucide-react";
import { PlaylistVideoItem } from "@/types";
import { useRemoveVideoFromPlaylistMutation } from "@/store/api";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistVideoCardProps {
    index: number;
    playlistId: string;
    playlistVideoId: string;
    videoItem: PlaylistVideoItem;
}

export default function PlaylistVideoCard({
  index,
  playlistId,
  playlistVideoId,
  videoItem
}: PlaylistVideoCardProps) {
    const [removeVideo, { isLoading: isRemoving }] = useRemoveVideoFromPlaylistMutation();

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();

        try {
            await removeVideo({ playlistId, playlistVideoId }).unwrap();
            toast.success("Removed from playlist");
        } catch (error) {
            console.error("Failed to remove video", error);
            toast.error("Failed to remove video");
        }
    };

    const isDeleted = videoItem.isDeleted || false;
    const title = videoItem.videoTitle || "Deleted video";
    const thumbnail = videoItem.thumbnailUrl || "/placeholder.jpg";
    const duration = videoItem.durationSeconds;

    const channelName = videoItem.channelName || "Unknown Channel";
    const views = videoItem.video?.viewsCount ? videoItem.video.viewsCount.toLocaleString() : "";
    const timeAgo = videoItem.video?.createdAt ? formatDistanceToNow(new Date(videoItem.video.createdAt), { addSuffix: true }) : "";

    const formatDuration = (time?: number) => {
        if (!time) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`flex items-start gap-4 p-2 rounded-xl group relative ${isRemoving ? 'opacity-50 pointer-events-none' : 'hover:bg-[#272727] transition-colors'}`}>
            <div className="text-[#aaaaaa] text-[14px] font-medium w-6 text-center mt-6 shrink-0 group-hover:hidden">
                {index}
            </div>

            <div className="w-6 text-center mt-6 shrink-0 hidden group-hover:flex items-center justify-center">
                <span className="text-[#aaaaaa] text-lg leading-none cursor-grab">⋮</span>
            </div>

            <Link href={isDeleted ? "#" : `/watch/${videoItem.videoId}`} className="relative w-[160px] sm:w-[180px] aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-[#3f3f3f]">
                <img src={thumbnail} alt={title} className={`w-full h-full object-cover ${isDeleted ? 'opacity-50 grayscale' : 'group-hover:scale-105 transition-transform'}`} />

                {duration ? (
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[12px] font-medium text-white tracking-wide z-10">
                        {formatDuration(duration)}
                    </div>
                ) : null}
            </Link>

            <div className="flex flex-col flex-1 py-1 min-w-0 pr-8">
                <Link href={isDeleted ? "#" : `/watch/${videoItem.videoId}`}>
                    <h3 className={`text-[16px] font-medium line-clamp-2 leading-snug mb-1 ${isDeleted ? 'text-[#aaaaaa]' : 'text-white group-hover:text-[#3ea6ff] transition-colors'}`}>
                        {title}
                    </h3>
                </Link>

                {!isDeleted && (
                    <>
                        <div className="text-[#aaaaaa] text-[14px] hover:text-white transition-colors truncate w-fit">
                            {channelName}
                        </div>

                        {views && timeAgo && (
                            <div className="text-[#aaaaaa] text-[13px] mt-0.5">
                                {views} views • {timeAgo}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full outline-none transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 bg-[#282828] border-[#3f3f3f] text-white rounded-xl shadow-2xl p-2">
                        <DropdownMenuItem
                            onClick={handleRemove}
                            className="cursor-pointer hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] rounded-lg text-[14px] py-2.5 text-red-400 focus:text-red-300"
                        >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Remove from playlist
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}