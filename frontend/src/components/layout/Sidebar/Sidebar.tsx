"use client"

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarItem } from "@/components/layout/Sidebar/SidebarItem";
import { useGetSubscriptionsQuery } from "@/store/api/apiSlice";

import { HomeIcon } from "@/components/icons/HomeIcon";
import { CompassIcon } from "@/components/icons/CompassIcon";
import { SubsIcon } from "@/components/icons/SubsIcon";
import { LibraryIcon } from "@/components/icons/LibraryIcon";
import { HistoryIcon } from "@/components/icons/HistoryIcon";
import { UVideosIcon } from "@/components/icons/UVideosIcon";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { ThumbsUpIcon } from "@/components/icons/ThumbsUpIcon";
import { GamepadIcon } from "@/components/icons/GamepadIcon";
import { LiveIcon } from "@/components/icons/LiveIcon";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { FlagIcon } from "@/components/icons/FlagIcon";
import { HelpIcon } from "@/components/icons/HelpIcon";
import { FeedbackIcon } from "@/components/icons/FeedbackIcon";

const mainItems = [
    { icon: HomeIcon, label: "Home", href: "/" },
    { icon: CompassIcon, label: "Explore", href: "/explore" },
    { icon: SubsIcon, label: "Subscriptions", href: "/feed/subscriptions" },
];

const libraryItems = [
    { icon: LibraryIcon, label: "Library", href: "/library" },
    { icon: HistoryIcon, label: "History", href: "/history" },
    { icon: UVideosIcon, label: "Your Videos", href: "/studio" },
    { icon: ListVideo, label: "Playlists", href: "/playlists" },
    { icon: ClockIcon, label: "Watch Later", href: "/playlist?list=WL" },
    { icon: ThumbsUpIcon, label: "Liked Videos", href: "/playlist?list=LL" },
];

const moreFromYoutube = [
    { icon: GamepadIcon, label: "Gaming", href: "/gaming" },
    { icon: LiveIcon, label: "Live", href: "/live" },
    { icon: TrophyIcon, label: "Sports", href: "/sports" },
];

const footerItems = [
    { icon: SettingsIcon, label: "Settings", href: "/settings" },
    { icon: FlagIcon, label: "Report history", href: "/reporthistory" },
    { icon: HelpIcon, label: "Help", href: "/help" },
    { icon: FeedbackIcon, label: "Send feedback", href: "/feedback" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentListId = searchParams.get("list");

    const { data: subscriptions = [] } = useGetSubscriptionsQuery();

    if (pathname.includes("/watch") || pathname === "/login" || pathname === "/register") {
        return null;
    }

    return (
        <>
            <aside className="fixed left-0 top-14 bottom-0 z-40 w-[240px] bg-[#0F0F0F] overflow-y-auto overflow-x-hidden hidden md:flex flex-col sidebar-scrollbar pb-4 border-r border-white/5">
                <div className="px-3 py-3 space-y-1">
                    {mainItems.map((item) => (
                        <SidebarItem key={item.label} {...item} isActive={pathname === item.href} />
                    ))}
                </div>

                <Separator className="bg-[#3F3F3F] mx-3 w-auto" />

                <div className="px-3 py-3 space-y-1">
                    {libraryItems.map((item) => (
                        <SidebarItem
                            key={item.label}
                            {...item}
                            isActive={
                                pathname === item.href ||
                                (item.label === "Watch Later" && currentListId === "WL") ||
                                (item.label === "Liked Videos" && currentListId === "LL")
                            }
                        />
                    ))}
                </div>

                <Separator className="bg-[#3F3F3F] mx-3 w-auto" />

                <div className="px-3 py-3">
                    <h3 className="px-4 text-[15px] font-semibold text-[#AAAAAA] mb-2">Subscriptions</h3>
                    <div className="space-y-1">
                        {subscriptions.map((sub: any) => {
                            const subHref = `/channel/${sub.channelId}`;
                            const isSubActive = pathname === subHref;

                            return (
                                <Link key={sub.id} href={subHref} className="block w-full">
                                    <Button
                                        variant="ghost"
                                        className={`cursor-pointer w-full justify-start gap-6 px-3 rounded-xl h-12 font-normal transition-colors ${
                                            isSubActive ? "bg-[#303030] hover:bg-[#303030]" : "hover:bg-[#272727]"
                                        }`}
                                    >
                                        <Avatar className="h-6 w-6 shrink-0">
                                            <AvatarImage src={sub.channelAvatarUrl || undefined} />
                                            <AvatarFallback className="bg-[#3ea6ff] text-[10px] text-white">
                                                {sub.channelName?.[0]?.toUpperCase() || "C"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className={`text-[15px] truncate text-white ${isSubActive ? "font-medium" : ""}`}>
                                            {sub.channelName}
                                        </span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <Separator className="bg-[#3F3F3F] mx-3 w-auto" />

                <div className="px-3 py-3">
                    <h3 className="px-4 text-[15px] font-semibold text-[#AAAAAA] mb-2">Explore</h3>
                    {moreFromYoutube.map((item) => (
                        <SidebarItem key={item.label} {...item} isActive={pathname === item.href} />
                    ))}
                </div>

                <Separator className="bg-[#3F3F3F] mx-3 w-auto" />

                <div className="px-3 py-3">
                    {footerItems.map((item) => (
                        <SidebarItem key={item.label} {...item} isActive={pathname === item.href} />
                    ))}
                </div>

                <div className="px-6 py-4 text-[#717171] text-[12px] font-semibold">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <a href="#">About</a><a href="#">Copyright</a><a href="#">Contact</a>
                    </div>
                    <p>© 2026 Google LLC</p>
                </div>
            </aside>

            <style jsx global>{`
                .sidebar-scrollbar::-webkit-scrollbar { 
                    width: 8px; /* Ширина зоны захвата */
                }
                .sidebar-scrollbar::-webkit-scrollbar-track { 
                    background: transparent; 
                }
                .sidebar-scrollbar::-webkit-scrollbar-thumb { 
                    background-color: #717171; 
                    border-radius: 10px; 
                    /* Рамка цвета фона съедает часть толщины ползунка, делая его тонким! */
                    border: 2px solid #0F0F0F; 
                }
                .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background-color: #aaaaaa; 
                }
            `}</style>
        </>
    );
}