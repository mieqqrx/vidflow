"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isWatchPage = pathname.includes("/watch");

    return (
        <main
            className={cn(
                "flex-1 min-h-screen transition-all duration-300",
                isWatchPage ? "ml-0" : "md:ml-[240px]"
            )}
        >
            {children}
        </main>
    );
}