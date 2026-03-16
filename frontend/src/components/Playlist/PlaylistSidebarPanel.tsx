"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Shuffle, Repeat, ChevronDown } from "lucide-react";
import { useGetPlaylistByIdQuery } from "@/store/api";
import { PlaylistVideoItem } from "@/types";

interface PlaylistSidebarPanelProps {
    playlistId: string;
    currentVideoId: string;
}

export default function PlaylistSidebarPanel({ playlistId, currentVideoId }: PlaylistSidebarPanelProps) {
    const { data: playlist, isLoading } = useGetPlaylistByIdQuery(playlistId);
    const [isExpanded, setIsExpanded] = useState(true);

    if (isLoading || !playlist) return null;

    const currentIndex = playlist.videos.findIndex(v => v.videoId === currentVideoId);

    return (
        <div className="bg-[#212121] border border-[#3f3f3f] rounded-xl overflow-hidden mb-6 flex flex-col max-h-[500px] transition-all duration-300">

            {/* ШАПКА ПАНЕЛИ */}
            <div className="p-4 bg-[#212121] flex flex-col gap-2 relative z-10 shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0 pr-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                        <h3 className="text-[16px] font-bold text-white line-clamp-1 hover:text-[#3ea6ff] transition-colors">
                            {playlist.title}
                        </h3>
                        <p className="text-[12px] text-[#aaaaaa] mt-0.5">
                            {playlist.title === "Watch Later" || playlist.title === "Liked Videos" ? playlist.title : "Playlist"}
                            {" • "}
                            {currentIndex + 1} / {playlist.videoCount}
                        </p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3f3f3f] transition-colors text-white">
                            <Repeat className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3f3f3f] transition-colors text-white">
                            <Shuffle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3f3f3f] transition-colors text-white"
                        >
                            {isExpanded ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* СПИСОК ВИДЕО */}
            {isExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212] py-2 relative">
                    {playlist.videos.map((item: PlaylistVideoItem, index: number) => {
                        const isCurrent = item.videoId === currentVideoId;
                        const isDeleted = item.isDeleted || false;
                        const title = item.video?.title || item.videoTitle || "Deleted video";
                        const channelName = item.channelName || item.video?.channelName || "Unknown Channel";

                        return (
                            <Link
                                href={isDeleted ? "#" : `/watch/${item.videoId}?list=${playlistId}`}
                                key={item.id}
                                className={`flex items-center gap-3 px-4 py-2 hover:bg-[#272727] transition-colors ${isCurrent ? 'bg-[#272727]' : ''}`}
                            >
                                {/* Индикатор проигрывания / Номер */}
                                <div className="w-4 shrink-0 flex justify-center items-center">
                                    {isCurrent ? (
                                        <PlayAnimationIcon />
                                    ) : (
                                        <span className="text-[12px] text-[#aaaaaa]">{index + 1}</span>
                                    )}
                                </div>

                                {/* Превью */}
                                <div className="relative w-[100px] h-[56px] shrink-0 bg-black rounded-lg overflow-hidden border border-[#3f3f3f]/50">
                                    <img
                                        src={item.video?.thumbnailUrl || item.thumbnailUrl || "/placeholder.jpg"}
                                        alt={title}
                                        className={`w-full h-full object-cover ${isDeleted ? 'opacity-50 grayscale' : ''}`}
                                    />
                                    {item.video?.durationSeconds ? (
                                        <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium text-white">
                                            {formatDuration(item.video.durationSeconds)}
                                        </span>
                                    ) : null}
                                </div>

                                {/* Текст */}
                                <div className="flex flex-col min-w-0">
                                    <h4 className={`text-[14px] font-medium line-clamp-2 leading-snug ${isDeleted ? 'text-[#aaaaaa]' : 'text-white'}`}>
                                        {title}
                                    </h4>
                                    {!isDeleted && (
                                        <span className="text-[12px] text-[#aaaaaa] mt-0.5 truncate">
                                            {channelName}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Анимация 3 полосочек, когда видео играет
function PlayAnimationIcon() {
    return (
        <div className="flex items-end justify-center gap-[2px] h-3">
            <div className="w-[3px] bg-white animate-[equalizer_1s_ease-in-out_infinite]" />
            <div className="w-[3px] bg-white animate-[equalizer_1s_ease-in-out_infinite_0.3s]" />
            <div className="w-[3px] bg-white animate-[equalizer_1s_ease-in-out_infinite_0.5s]" />

            <style jsx>{`
                @keyframes equalizer {
                    0%, 100% { height: 30%; }
                    50% { height: 100%; }
                }
            `}</style>
        </div>
    );
}

function formatDuration(time?: number) {
    if (!time) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}