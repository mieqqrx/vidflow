"use client";

import React, {useState} from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Plus,
    UserCircle,
    Loader2
} from "lucide-react";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { MicIcon } from "@/components/icons/MicIcon";

import { useGetMeQuery } from "@/store/api/apiSlice";
import { ProfileDropdown } from "./ProfileDropdown";
import UploadVideoModal from "@/components/Upload/UploadVideoModal";
import NotificationMenu from "@/components/layout/Header/NotificationMenu";

export default function Header() {
    const { data: user, isLoading } = useGetMeQuery();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <header className="fixed top-0 z-50 w-full border-b border-[#2e2e2e] bg-[#212121] h-14 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full cursor-pointer hover:bg-white/10" >
                    <MenuIcon className="h-6 w-6 text-[#EEEEEE]"/>
                </Button>

                <Link href="/" className="flex items-center gap-1 cursor-pointer">
                    <div className="relative h-7 w-7">
                        <Image src="/vidflow_logo.png" alt="VidFlow Logo" width={28} height={28} className="object-contain" />
                    </div>

                    <span className="text-xl font-bold tracking-tighter text-[#EEEEEE] font-sans relative bottom-[1px]">VidFlow</span>
                </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-[620px] items-center gap-4 px-4">
                <div className="flex w-full items-center">
                    <div className="relative w-full">
                        <Input
                            placeholder="Search"
                            className="h-10 w-full rounded-l-full rounded-r-none border border-[#303030] !bg-[#121212] text-white placeholder:text-[#888888] pl-4 focus-visible:ring-1 focus-visible:ring-blue-500 border-r-0 shadow-inner"
                        />
                    </div>

                    <Button variant="secondary" className="h-10 w-16 rounded-r-full rounded-l-none border border-l-0 border-[#303030] bg-[#303030] hover:bg-[#222222] cursor-pointer flex-shrink-0">
                        <SearchIcon className="h-6 w-6 text-[#EEEEEE]"/>
                    </Button>
                </div>

                <Button variant="secondary" size="icon" className="rounded-full bg-[#121212] hover:bg-[#303030] cursor-pointer shrink-0 w-10 h-10">
                    <MicIcon className="h-5 w-5 text-[#EEEEEE]" />
                </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
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

                        {/* Вставляем компонент уведомлений */}
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