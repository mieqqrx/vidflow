"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    LogOut,
    Settings,
    User as UserIcon,
    HelpCircle,
    Moon,
    Languages,
    Keyboard,
    Shield
} from "lucide-react";

import { User as UserType } from "@/types";
import { useLogoutMutation, useGetMyChannelQuery } from "@/store/api/apiSlice";

interface ProfileDropdownProps {
    user: UserType;
}

export const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
    const [logout] = useLogoutMutation();

    const { data: myChannel, isLoading: isChannelLoading } = useGetMyChannelQuery();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
            window.location.href = "/";
        } catch (error) {
            console.error("Error to logout", error);
        }
    };

    const username = user.username || "User";
    const email = user.email || "";
    const avatarUrl = myChannel?.avatarUrl || user.avatarUrl;
    const firstLetter = username?.[0]?.toUpperCase() || "U";

    const hasChannel = Boolean(myChannel);
    const channelLink = hasChannel ? `/channel/${myChannel?.id}` : "/channel/create";
    const channelActionText = hasChannel ? "View your channel" : "Create a channel";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer ml-2 hover:opacity-80 transition select-none">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {firstLetter}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-[300px] bg-[#282828] border-none text-white shadow-xl rounded-xl py-2 mt-2 mr-2"
            >
                <div className="px-4 py-3 flex gap-4 items-start">
                    <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-purple-600 text-white text-sm">
                            {firstLetter}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <p className="text-[16px] font-normal truncate max-w-[180px]">{username}</p>
                        <p className="text-[14px] text-[#AAAAAA] truncate max-w-[180px]">{email}</p>

                        <Link
                            href={isChannelLoading ? "#" : channelLink}
                            className={`text-[#3ea6ff] text-[14px] mt-1 hover:text-[#6ebcff] no-underline font-medium ${isChannelLoading ? 'opacity-50 cursor-default' : ''}`}
                        >
                            {isChannelLoading ? "Loading..." : channelActionText}
                        </Link>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-[#3e3e3e] my-2" />

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><UserIcon className="w-6 h-6 font-light text-[#AAAAAA]" /></div>
                    <span>Switch account</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white"
                >
                    <div className="mr-4"><LogOut className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Sign out</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#3e3e3e] my-2" />

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white group">
                    <div className="mr-4"><Moon className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span className="flex-1">Appearance: Device theme</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><Languages className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Language: English</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><Shield className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Restricted Mode: Off</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><Keyboard className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Keyboard shortcuts</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#3e3e3e] my-2" />

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><Settings className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                    <div className="mr-4"><HelpCircle className="w-6 h-6 text-[#AAAAAA]" /></div>
                    <span>Help</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};