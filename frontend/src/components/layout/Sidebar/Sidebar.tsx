"use client"

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarItem } from "@/components/layout/Sidebar/SidebarItem";

import { useGetSubscriptionsQuery } from "@/store/api";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeDrawer } from "@/store/slices/sidebarSlice";

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

const miniItems = [
    { icon: HomeIcon, label: "Home", href: "/" },
    { icon: CompassIcon, label: "Shorts", href: "/shorts" },
    { icon: SubsIcon, label: "Subscriptions", href: "/feed/subscriptions" },
    { icon: LibraryIcon, label: "You", href: "/library" },
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
    { icon: SettingsIcon, label: "Settings", href: "/settings/notifications" },
    { icon: FlagIcon, label: "Report history", href: "/reporthistory" },
    { icon: HelpIcon, label: "Help", href: "/help" },
    { icon: FeedbackIcon, label: "Send feedback", href: "/feedback" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentListId = searchParams.get("list");

    const dispatch = useAppDispatch();
    const { isOpen, isDrawerOpen } = useAppSelector((state) => state.sidebar);

    const { data: subscriptions = [] } = useGetSubscriptionsQuery();

    useEffect(() => {
        dispatch(closeDrawer());
    }, [pathname, dispatch]);

    if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname?.startsWith("/admin")
    ) {
        return null;
    }

    const isWatchPage = pathname?.includes("/watch");

    const showMiniSidebar = !isWatchPage && !isOpen && !isDrawerOpen;

    return (
        <>
            <AnimatePresence>
                {isDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[45] cursor-pointer"
                        onClick={() => dispatch(closeDrawer())}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isDrawerOpen ? 240 : (isWatchPage ? 240 : (isOpen ? 240 : 72)),
                    x: isDrawerOpen ? 0 : (isWatchPage ? "-100%" : 0)
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={`fixed left-0 top-14 bottom-0 z-50 bg-[#0F0F0F] overflow-y-auto overflow-x-hidden sidebar-scrollbar pb-4 border-r border-white/5 flex-col ${
                    isDrawerOpen ? "flex" : (isWatchPage ? "flex" : "hidden md:flex")
                }`}
            >
                {showMiniSidebar ? (
                    <div className="flex flex-col items-center pt-2 w-[72px]">
                        {miniItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center w-[64px] h-[74px] rounded-xl hover:bg-[#272727] mb-1 text-white transition-colors ${isActive ? "font-bold" : ""}`}>
                                    <Icon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] truncate w-full text-center px-1">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-[240px] min-w-[240px] flex flex-col">
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
                    </div>
                )}
            </motion.aside>

            <style jsx global>{`
                .sidebar-scrollbar::-webkit-scrollbar { 
                    width: 8px;
                }
                .sidebar-scrollbar::-webkit-scrollbar-track { 
                    background: transparent; 
                }
                .sidebar-scrollbar::-webkit-scrollbar-thumb { 
                    background-color: #717171; 
                    border-radius: 10px; 
                    border: 2px solid #0F0F0F; 
                }
                .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background-color: #aaaaaa; 
                }
            `}</style>
        </>
    );
}