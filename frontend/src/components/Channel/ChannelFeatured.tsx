"use client";

import React from "react";
import Link from "next/link";
import {
    Play, SkipForward, Volume2, Settings, Maximize, Info
} from "lucide-react";
import { Video } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fixUrl } from "@/utils/fixUrl";

interface ChannelFeaturedProps {
    video: Video;
}

export default function ChannelFeatured({ video }: ChannelFeaturedProps) {
    const timeAgo = video.createdAt
        ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
        : "";

    return (
        <Link
            href={`/watch/${video.id}`}
            className="flex flex-col md:flex-row gap-6 mb-8 group cursor-pointer no-underline"
        >
            <div className="w-full md:w-[420px] lg:w-[500px] xl:w-[600px] aspect-video relative rounded-xl overflow-hidden bg-black shrink-0 shadow-lg">
                <img
                    src={fixUrl(video.thumbnailUrl) || "/placeholder.jpg"}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                />

                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <h3 className="text-white text-[18px] font-normal line-clamp-1 pr-4 drop-shadow-md">
                        {video.title}
                    </h3>

                    <Info className="text-white w-6 h-6 drop-shadow-md opacity-90 hover:opacity-100" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-[#FF0000] transition-colors duration-300 shadow-2xl">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-full h-[3px] bg-white/30 cursor-pointer relative group/progress">
                        <div className="absolute top-0 left-0 h-full w-[35%] bg-[#FF0000] z-10" />
                    </div>

                    <div className="flex items-center justify-between text-white mt-1">
                        <div className="flex items-center gap-5">
                            <Play className="w-6 h-6 fill-white" />
                            <SkipForward className="w-6 h-6 fill-white" />
                            <Volume2 className="w-6 h-6" />
                        </div>

                        <div className="flex items-center gap-5">
                            <Settings className="w-5 h-5" />
                            <Maximize className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col py-1">
                <h2 className="text-white text-[18px] md:text-[20px] font-medium leading-tight mb-2 line-clamp-2 group-hover:text-[#3ea6ff] transition-colors">
                    {video.title}
                </h2>

                <div className="text-[#AAAAAA] text-[13px] mb-4 font-medium">
                    {(video.viewsCount || 0).toLocaleString()} views • {timeAgo}
                </div>

                <p className="text-[#AAAAAA] text-[14px] leading-relaxed max-w-4xl line-clamp-4 md:line-clamp-6">
                    {video.description}
                </p>
            </div>
        </Link>
    );
}