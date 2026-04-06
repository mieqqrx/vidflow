"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
    Plus,
    UserCircle,
    Loader2
} from "lucide-react";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { MicIcon } from "@/components/icons/MicIcon";

import { useGetMeQuery } from "@/store/api";
import { ProfileDropdown } from "./ProfileDropdown";
import UploadVideoModal from "@/components/Upload/UploadVideoModal";
import NotificationMenu from "@/components/layout/Header/NotificationMenu";
import SearchBar from "@/components/layout/Header/SearchBar";

import { useAppDispatch } from "@/store/hooks";
import { toggleSidebar, toggleDrawer } from "@/store/slices/sidebarSlice";

export default function Header() {
    const { data: user, isLoading } = useGetMeQuery();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const pathname = usePathname();
    const dispatch = useAppDispatch();

    if (pathname?.startsWith("/admin")) {
        return null;
    }

    const handleMenuClick = () => {
        const isWatchPage = pathname?.includes("/watch");
        if (isWatchPage || window.innerWidth < 768) {
            dispatch(toggleDrawer());
        } else {
            dispatch(toggleSidebar());
        }
    };

    return (
        <header className="fixed top-0 z-50 w-full border-b border-[#2e2e2e] bg-[#212121] h-14 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4 shrink-0">
                <Button
                    onClick={handleMenuClick}
                    variant="ghost"
                    size="icon"
                    className="rounded-full cursor-pointer hover:bg-white/10"
                >
                    <MenuIcon className="h-6 w-6 text-[#EEEEEE]"/>
                </Button>

                <Link href="/" className="flex items-center gap-1 cursor-pointer">
                    <div className="relative h-7 w-7">
                        <Image src="/vidflow_logo.png" alt="VidFlow Logo" width={28} height={28} className="object-contain" />
                    </div>

                    <span className="text-xl font-bold tracking-tighter text-[#EEEEEE] font-sans relative bottom-[1px]">VidFlow</span>
                </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-[700px] items-center gap-4 px-4 ml-8">
                <SearchBar />

                <Button variant="secondary" size="icon" className="rounded-full bg-[#181818] hover:bg-[#303030] cursor-pointer shrink-0 w-10 h-10 border border-[#3F3F3F]">
                    <MicIcon className="h-5 w-5 text-[#EEEEEE]" />
                </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {isLoading ? (
                    <Loader2 className="animate-spin text-[#3ea6ff]" />
                ) : user ? (
                    <>
                        <Button
                            variant="ghost"
                            className="cursor-pointer hidden md:flex items-center gap-2 rounded-full hover:bg-[#272727] px-3 h-9"
                            onClick={() => setIsUploadOpen(true)}
                        >
                            <Plus className="h-6 w-6 text-[#EEEEEE]" />
                            <span className="text-[#EEEEEE] font-medium text-sm">Create</span>
                        </Button>

                        <NotificationMenu />

                        <ProfileDropdown user={user} />
                    </>
                ) : (
                    <Link href="/login">
                        <div className="flex items-center gap-2 bg-[#303030] border border-[#676767]/30 rounded-full px-3 py-1.5 hover:bg-[#3ea6ff]/10 transition-colors cursor-pointer group">
                            <UserCircle className="w-6 h-6 text-[#EEEEEE]" />
                            <span className="text-[#EEEEEE] font-medium text-sm">Sign in</span>
                        </div>
                    </Link>
                )}
            </div>

            <UploadVideoModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />
        </header>
    );
}