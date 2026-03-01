"use client";

import React from "react";
import { MoreVertical } from "lucide-react";
import Link from "next/link";

export interface SecondaryVideoProps {
    id: string | number;
    thumbnail: string | null;
    duration?: string | number; // Сделали необязательным и добавили number
    title: string;
    channelId?: string;
    channelName: string;
    views: string | number;
    postedAt: string;
}

// Функция форматирования времени (та же логика, что в VideoCard)
const formatDuration = (time: string | number | undefined) => {
    if (!time) return null;
    if (typeof time === "string") return time;

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function SecondaryVideoCard({
   id,
   thumbnail,
   duration,
   title,
   channelId,
   channelName,
   views,
   postedAt
}: SecondaryVideoProps) {
    const formattedViews = typeof views === "number" ? views.toLocaleString() : views;
    const formattedDuration = formatDuration(duration); // Применяем форматирование

    return (
        <div className="flex gap-2 group pr-2 w-full">
            <Link href={`/watch/${id}`} className="relative w-40 h-24 shrink-0 rounded-xl overflow-hidden bg-[#212121] block cursor-pointer">
                <img
                    src={thumbnail || "/placeholder.jpg"}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Плашка времени появляется только если есть данные  */}
                {formattedDuration && (
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded-[4px] text-[10px] font-medium text-white tracking-wide">
                        {formattedDuration}
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <Link href={`/watch/${id}`}>
                    <h3 className="text-white text-[14px] font-medium leading-tight line-clamp-2 group-hover:text-[#3ea6ff] transition-colors cursor-pointer">
                        {title}
                    </h3>
                </Link>

                <div className="text-[#AAAAAA] text-[12px] flex flex-col">
                    {channelId ? (
                        <Link href={`/channel/${channelId}`} className="w-fit">
                            <div className="hover:text-white transition-colors truncate cursor-pointer">
                                {channelName}
                            </div>
                        </Link>
                    ) : (
                        <div className="truncate">{channelName}</div>
                    )}

                    <div className="flex items-center gap-1 mt-0.5">
                        <span>{formattedViews} views</span>
                        <span>•</span>
                        <span>{postedAt}</span>
                    </div>
                </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button className="p-1 hover:bg-[#272727] rounded-full transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
}