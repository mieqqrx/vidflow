"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelNotFoundPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen bg-[#0F0F0F] items-center justify-center">
            <div className="flex flex-col items-center text-center px-4 -mt-20">
                <div className="mb-6 relative">
                    <Tv className="w-24 h-24 text-[#3F3F3F]" strokeWidth={1.5} />
                </div>

                <h2 className="text-xl font-medium text-white mb-2">
                    This channel does not exist.
                </h2>

                <p className="text-[#AAAAAA] text-[14px] max-w-[420px] mb-8 leading-relaxed">
                    This user hasn't created a channel yet.
                    Check back later or explore other videos on the home page.
                </p>

                <Button
                    onClick={() => router.push("/")}
                    className="bg-white text-black hover:bg-gray-200 rounded-full px-6 h-10 font-medium transition-all cursor-pointer"
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
}