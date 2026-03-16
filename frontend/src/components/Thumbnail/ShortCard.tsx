"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { fixUrl } from "@/utils/fixUrl";

interface ShortCardProps {
    id: string;
    thumbnail: string | null;
    title: string;
    views: number;
}

export default function ShortCard({ id, thumbnail, title, views }: ShortCardProps) {
    const formatViews = (count: number) => {
        if (!count) return "0 views";
        if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + "M views";
        if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + "K views";
        return count.toString() + " views";
    };

    const thumbUrl = fixUrl(thumbnail) || '/placeholder.jpg';

    return (
        <div className="flex flex-col gap-3 w-[150px] sm:w-[180px] md:w-[210px] group cursor-pointer">
            <Link href={`/shorts/${id}`}>
                <div className="w-full aspect-[9/16] rounded-xl overflow-hidden relative">
                    <img
                        src={thumbUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                </div>
            </Link>

            <div className="flex items-start justify-between gap-2 pr-1">
                <div className="flex flex-col">
                    <Link href={`/shorts/${id}`}>
                        <h3 className="text-white text-[14px] sm:text-[15px] font-medium line-clamp-2 leading-tight">
                            {title}
                        </h3>
                    </Link>
                    <span className="text-[#AAAAAA] text-[12px] sm:text-[13px] mt-1">
                        {formatViews(views)}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    className="text-white opacity-0 group-hover:opacity-100 p-1.5 -mt-1 -mr-2 rounded-full hover:bg-[#272727] transition-all shrink-0"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}