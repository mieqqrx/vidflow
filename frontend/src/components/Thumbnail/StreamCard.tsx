"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LiveStreamResponse, LiveStreamStatus } from "@/types/stream";

interface StreamCardProps {
    stream: LiveStreamResponse;
}

export default function StreamCard({ stream }: StreamCardProps) {
    const [imgError, setImgError] = useState(false);

    // Используем enum для строгой и читаемой проверки
    const isLive = stream.status === LiveStreamStatus.Live;
    const isScheduled = stream.status === LiveStreamStatus.Scheduled;
    const isEnded = stream.status === LiveStreamStatus.Ended;

    const timeAgo = stream.createdAt
        ? formatDistanceToNow(new Date(stream.createdAt), { addSuffix: true })
        : "Recently";

    return (
        <Link href={`/live/${stream.id}`} className="flex flex-col gap-3 group cursor-pointer">
            <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#3f3f3f]/50 flex items-center justify-center">
                {!imgError && stream.thumbnailUrl ? (
                    <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-[#555]">
                        <Radio className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-[12px] font-bold opacity-40 tracking-widest uppercase">Live Stream</span>
                    </div>
                )}

                {isLive && (
                    <div className="absolute bottom-2 right-2 bg-[#CC0000] text-white text-[12px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg">
                        <Radio className="w-3 h-3 animate-pulse" /> LIVE
                    </div>
                )}

                {isLive && (
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[12px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg">
                        <Users className="w-3 h-3" /> {stream.viewersCount?.toLocaleString() || 0}
                    </div>
                )}

                {isScheduled && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-0.5 rounded shadow-lg">
                        UPCOMING
                    </div>
                )}

                {isEnded && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-0.5 rounded shadow-lg">
                        WAS LIVE
                    </div>
                )}
            </div>

            <div className="flex flex-col pr-6">
                <h3 className="text-[14px] font-medium text-white line-clamp-2 group-hover:text-[#3ea6ff] transition-colors leading-tight">
                    {stream.title}
                </h3>
                <div className="text-[12px] text-[#AAAAAA] mt-1.5 flex flex-col gap-0.5">
                    {isLive ? (
                        <span className="text-[#CC0000] font-medium flex items-center gap-1">
                            Streaming now
                        </span>
                    ) : isScheduled ? (
                        <span>Waiting for broadcast</span>
                    ) : (
                        <span>Streamed {timeAgo}</span>
                    )}
                    <span className="text-[12px]">{stream.totalViewsCount?.toLocaleString() || 0} views</span>
                </div>
            </div>
        </Link>
    );
}