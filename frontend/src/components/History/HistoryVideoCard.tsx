"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { WatchHistoryItem } from "@/types";

interface HistoryVideoCardProps {
    item: WatchHistoryItem;
    onRemove: (videoId: string) => void;
}

export default function HistoryVideoCard({ item, onRemove }: HistoryVideoCardProps) {
    const title = item.videoTitle || "Deleted video";
    const channelName = item.channelName || "Unknown Channel";
    const thumbnail = item.thumbnailUrl || "/placeholder.jpg";

    const formatDuration = (seconds: number) => {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="group flex flex-col sm:flex-row gap-4 relative py-2 rounded-xl transition-colors hover:bg-[#272727]/40 w-full max-w-[1000px]">
            <Link href={`/watch/${item.videoId}`} className="shrink-0 relative w-[160px] sm:w-[246px] aspect-video bg-[#212121] rounded-xl overflow-hidden cursor-pointer border border-[#3f3f3f]/50">
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[12px] font-medium text-white tracking-wide">
                    {formatDuration(item.durationSeconds)}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#aaaaaa]/30">
                    <div
                        className="h-full bg-[#FF0000] transition-all duration-300"
                        style={{ width: `${Math.min(Math.max(item.watchedPercent, 0), 100)}%` }}
                    />
                </div>
            </Link>

            <div className="flex-1 min-w-0 py-1 pr-8">
                <Link href={`/watch/${item.videoId}`} className="block">
                    <h3 className="text-white text-[16px] sm:text-[18px] font-medium line-clamp-2 leading-snug group-hover:text-[#3ea6ff] transition-colors">
                        {title}
                    </h3>
                </Link>

                <div className="text-[#AAAAAA] text-[13px] sm:text-[14px] mt-1.5 flex items-center flex-wrap gap-1">
                    <Link href={`/channel/some-id`} className="hover:text-white transition-colors">
                        {channelName}
                    </Link>
                </div>

                <p className="hidden sm:block text-[#AAAAAA] text-[12px] mt-2 line-clamp-1">
                    Watched • {Math.round(item.watchedPercent)}% completed
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    onRemove(item.videoId);
                }}
                className="absolute top-2 right-2 p-2 rounded-full hover:bg-[#3f3f3f] text-[#aaaaaa] hover:text-white transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                title="Remove from watch history"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}