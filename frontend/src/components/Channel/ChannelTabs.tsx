"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: string[] = [
    "HOME",
    "VIDEOS",
    "PLAYLISTS",
    "LIVE",
];

interface ChannelTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function ChannelTabs({ activeTab, setActiveTab }: ChannelTabsProps) {
    return (
        <div className="px-6 md:px-16 mt-0 flex items-center justify-between border-b border-[#3F3F3F]">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-3 text-sm font-semibold uppercase cursor-pointer tracking-wider border-b-[3px] transition-colors whitespace-nowrap",
                            activeTab === tab
                                ? "border-white text-white"
                                : "border-transparent text-[#AAAAAA] hover:text-white"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[#AAAAAA] pb-3">
                <Button variant="ghost" size="icon" className="hover:text-white cursor-pointer hover:bg-transparent">
                    <Search className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="hover:text-white cursor-pointer hover:bg-transparent">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}