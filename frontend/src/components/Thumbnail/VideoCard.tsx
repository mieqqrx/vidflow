"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { MoreVertical, ListPlus, Clock, Flag } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SaveToPlaylistModal from "@/components/Playlist/SaveToPlaylistModal";
import ReportVideoModal from "@/components/Report/ReportVideoModal";

export interface VideoProps {
    id: string | number;
    thumbnail: string | null;
    duration?: string | number;
    title: string;
    channelId?: string;
    channelName: string;
    channelAvatar: string | null;
    views: string | number;
    postedAt: string;
    hideAvatar?: boolean;
    watchedPercent?: number;
}

const formatDuration = (time: string | number | undefined) => {
    if (!time) return null;
    if (typeof time === "string") return time;

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function VideoCard({
    id,
    thumbnail,
    duration,
    title,
    channelId,
    channelName,
    channelAvatar,
    views,
    postedAt,
    hideAvatar = false,
    watchedPercent,
}: VideoProps) {
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const firstLetter = channelName?.[0]?.toUpperCase() || "C";
    const formattedViews = typeof views === "number" ? views.toLocaleString() : views;
    const formattedDuration = formatDuration(duration);

    return (
        <div className="flex flex-col gap-3 group w-full relative">
            <Link href={`/watch/${id}`} className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#212121] border border-[#3F3F3F] block">
                <img
                    src={thumbnail || "/placeholder.jpg"}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
                />

                {formattedDuration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[12px] font-medium text-white tracking-wide z-10">
                        {formattedDuration}
                    </div>
                )}

                {watchedPercent !== undefined && watchedPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#aaaaaa]/30 z-10">
                        <div
                            className="h-full bg-[#FF0000] transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(watchedPercent, 0), 100)}%` }}
                        />
                    </div>
                )}
            </Link>

            <div className="flex gap-3 items-start relative">
                {!hideAvatar && (
                    <Link href={`/channel/${channelId}`} className="shrink-0 mt-0.5">
                        <Avatar className="h-9 w-9 rounded-full">
                            <AvatarImage src={channelAvatar || undefined} />

                            <AvatarFallback className="bg-purple-600 text-xs text-white">
                                {firstLetter}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                )}

                <div className="flex flex-col overflow-hidden flex-1 pr-8">
                    <Link href={`/watch/${id}`}>
                        <h3 className="text-white text-[16px] font-semibold leading-snug line-clamp-2 group-hover:text-[#3ea6ff] transition-colors">
                            {title}
                        </h3>
                    </Link>

                    {!hideAvatar && channelId ? (
                        <Link href={`/channel/${channelId}`}>
                            <div className="text-[#AAAAAA] text-[14px] mt-1 hover:text-white transition-colors truncate">
                                {channelName}
                            </div>
                        </Link>
                    ) : (
                        !hideAvatar && <div className="text-[#AAAAAA] text-[14px] mt-1 truncate">{channelName}</div>
                    )}

                    <div className="text-[#AAAAAA] text-[14px] flex items-center mt-0.5">
                        <span>{formattedViews} views</span>
                        <span className="mx-1">•</span>
                        <span>{postedAt}</span>
                    </div>
                </div>

                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full transition-colors cursor-pointer outline-none">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#282828] border-[#3f3f3f] text-white rounded-xl shadow-2xl p-2 z-50">

                            <DropdownMenuItem className="cursor-pointer hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] rounded-lg text-[14px] py-2.5">
                                <Clock className="w-4 h-4 mr-3" />
                                Save to Watch Later
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setIsPlaylistModalOpen(true)} className="cursor-pointer hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] rounded-lg text-[14px] py-2.5">
                                <ListPlus className="w-4 h-4 mr-3" />
                                Save to playlist
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] rounded-lg text-[14px] py-2.5">
                                <Flag className="w-4 h-4 mr-3 text-[#AAAAAA]" />
                                Report
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <SaveToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                videoId={String(id)}
            />

            <ReportVideoModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                videoId={String(id)}
            />
        </div>
    );
}