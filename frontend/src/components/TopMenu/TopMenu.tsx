"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
    "All", "Gaming", "Music", "Live", "Software Engineering",
    "Computer programming", "Gadgets", "Podcasts", "Sketch comedy",
    "Recent", "Watched", "New to you", "Mixes", "News", "System design"
];

export default function TopMenu() {
    return (
        <div className="sticky top-0 z-10 bg-[#0F0F0F]/95 backdrop-blur-sm w-full py-3">
            <div className="relative flex items-center w-full px-4 max-w-full group">
                <div className="flex overflow-x-auto gap-3 whitespace-nowrap scroll-smooth px-1 no-scrollbar w-full">
                    {categories.map((category, index) => (
                        <button
                            key={category}

                            className={cn(
                                "h-8 px-3 rounded-lg text-[14px] font-medium transition-colors duration-200 flex-shrink-0 cursor-pointer border border-transparent snap-start",
                                index === 0
                                    ? "bg-[#F1F1F1] text-[#0F0F0F] hover:bg-white"
                                    : "bg-[#272727] text-white hover:bg-[#3F3F3F]"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center">
                    <div className="h-full w-12 bg-gradient-to-l from-[#0F0F0F] to-transparent pointer-events-none" />

                    <div className="bg-[#0F0F0F] h-full flex items-center pl-2 pr-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-[#212121] hover:bg-[#303030] border border-transparent shrink-0"
                        >
                            <ChevronRight className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}