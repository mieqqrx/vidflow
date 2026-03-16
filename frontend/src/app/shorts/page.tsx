"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGetShortsQuery } from "@/store/api";

export default function ShortsIndexPage() {
    const router = useRouter();

    const { data: shorts, isLoading } = useGetShortsQuery({ page: 1, pageSize: 1 });

    useEffect(() => {
        if (shorts && shorts.length > 0) {
            router.replace(`/shorts/${shorts[0].id}`);
        }
    }, [shorts, router]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-72px)] bg-[#0f0f0f] items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-72px)] bg-[#0f0f0f] items-center justify-center text-[#aaaaaa] text-lg">
            <p>No Shorts available right now.</p>
        </div>
    );
}