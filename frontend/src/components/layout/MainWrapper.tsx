"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function MainWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();

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

    const isSidebarHidden = isWatchPage || isAuthPage;

    return (
        <main
            className={
                `min-h-screen ${
                    isWatchPage || isSearchPage || isPlaylistPage || isStudioPage || isHistoryPage || isLiveStreamPage
                    ? "pt-0" 
                    : "pt-14"} ${isSidebarHidden ? "" 
                    : "md:ml-[240px]"
                }`
            }
        >
            {children}
        </main>
    );
}