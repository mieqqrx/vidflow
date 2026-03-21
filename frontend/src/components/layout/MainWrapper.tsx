"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { useAppSelector } from "@/store/hooks";

export default function MainWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { isOpen } = useAppSelector((state) => state.sidebar);

    if (pathname?.startsWith("/admin")) {
        return <>{children}</>;
    }

    const isWatchPage = pathname?.includes("/watch");
    const isSearchPage = pathname?.includes("/search");
    const isPlaylistPage = pathname?.startsWith("/playlists");
    const isStudioPage = pathname?.startsWith("/studio");
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isHistoryPage = pathname?.includes("/history");
    const isLiveStreamPage = pathname?.startsWith("/live");
    const isChannelPage = pathname?.startsWith("/channel");

    const isOverlayPage = isWatchPage || isAuthPage;

    return (
        <main
            className={`min-h-screen transition-[margin] duration-200 ease-in-out ${
                isWatchPage || isSearchPage || isPlaylistPage
                || isStudioPage || isHistoryPage || isLiveStreamPage
                || isChannelPage
                    ? "pt-0"
                    : "pt-14"
            } ${
                !isOverlayPage && isOpen ? "md:ml-[240px]" : "md:ml-0"
            }`}
        >
            {children}
        </main>
    );
}