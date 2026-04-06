"use client";

import React from "react";
import Link from "next/link";
import { ThumbsUp, Share2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LiveStreamInfo({
   stream,
   isOwner,
   isSubscribed,
   isTogglingSub,
   handleSubscribeClick
}: any) {
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    return (
        <>
            <h1 className="text-[20px] md:text-[22px] font-bold mt-4 line-clamp-2">
                {stream.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
                <div className="flex items-center gap-3">
                    <Link href={`/channel/${stream.channelId}`}>
                        <Avatar className="h-10 w-10 cursor-pointer">
                            <AvatarImage src={stream.channelAvatarUrl || undefined} />
                            <AvatarFallback className="bg-purple-600 text-white">{stream.channelName?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex flex-col mr-4">
                        <Link href={`/channel/${stream.channelId}`}>
                            <span className="font-bold text-[16px] cursor-pointer hover:text-gray-300 transition-colors">
                                {stream.channelName}
                            </span>
                        </Link>
                    </div>

                    {isOwner ? (
                        <Link href="/studio">
                            <Button className="bg-[#272727] text-white hover:bg-[#3f3f3f] font-medium rounded-full px-5 h-9 text-sm transition-colors border border-[#3f3f3f] cursor-pointer">
                                Manage
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            onClick={handleSubscribeClick}
                            disabled={isTogglingSub}
                            className={isSubscribed
                                ? "bg-[#272727] text-white hover:bg-[#3f3f3f] font-medium rounded-full px-5 h-9 text-sm transition-colors border border-[#3f3f3f] cursor-pointer"
                                : "bg-white text-black hover:bg-gray-200 font-medium rounded-full px-5 h-9 text-sm transition-colors cursor-pointer"
                            }
                        >
                            {isTogglingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : isSubscribed ? "Subscribed" : "Subscribe"}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <div className="flex items-center bg-[#272727] rounded-full h-9 shrink-0 overflow-hidden">
                        <button className="flex items-center gap-2 px-4 h-full hover:bg-[#3F3F3F] rounded-l-full border-r border-[#3F3F3F] transition-colors cursor-pointer">
                            <ThumbsUp className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Like</span>
                        </button>

                        <button className="px-4 h-full hover:bg-[#3F3F3F] rounded-r-full transition-colors cursor-pointer">
                            <ThumbsUp className="w-[18px] h-[18px] rotate-180" />
                        </button>
                    </div>

                    <Button onClick={handleShare} variant="ghost" className="bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-full h-9 gap-2 px-4 shrink-0 transition-colors cursor-pointer">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                </div>
            </div>

            <div className="bg-[#272727] rounded-xl p-3 mt-4 text-sm mt-4">
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                    {stream.description || "No description provided."}
                </p>
            </div>
        </>
    );
}