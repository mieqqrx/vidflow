"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setActiveUser, clearActiveUser } from "@/store/slices/authSlice";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    LogOut, Settings, User as UserIcon, HelpCircle, Moon,
    Languages, Keyboard, Shield, ShieldAlert, ChevronLeft, Check, Plus
} from "lucide-react";

import { User as UserType } from "@/types";
import {
    useGetMyChannelQuery,
    useLogoutMutation,
    useLogoutAllMutation,
    useGetSessionsQuery
} from "@/store/api";

interface ProfileDropdownProps {
    user: UserType;
}

export const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
    const router = useRouter();
    const dispatch = useDispatch();

    const [view, setView] = useState<'main' | 'accounts'>('main');

    const [logout] = useLogoutMutation();
    const [logoutAll] = useLogoutAllMutation();
    const { data: myChannel, isLoading: isChannelLoading } = useGetMyChannelQuery();

    const { data: sessions = [] } = useGetSessionsQuery();

    const username = user.username || "User";
    const email = user.email || "";
    const avatarUrl = myChannel?.avatarUrl || user.avatarUrl || null;
    const firstLetter = username?.[0]?.toUpperCase() || "U";

    useEffect(() => {
        if (user.id) {
            dispatch(setActiveUser(user.id));
        }
    }, [user.id, dispatch]);

    const handleSwitchAccount = (userId: string) => {
        dispatch(setActiveUser(userId));
        window.location.href = "/";
    };

    const handleAddAccount = () => {
        router.push("/login");
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
            const remainingSessions = sessions.filter(s => s.id !== user.id);
            if (remainingSessions.length > 0) {
                dispatch(setActiveUser(remainingSessions[0].id));
            } else {
                dispatch(clearActiveUser());
            }
            window.location.href = "/";
        } catch (error) {
            console.error("Error to logout", error);
        }
    };

    const handleLogoutAll = async () => {
        try {
            await logoutAll().unwrap();
            dispatch(clearActiveUser());
            window.location.href = "/";
        } catch (error) {
            console.error("Error to logout all", error);
        }
    };

    const hasChannel = Boolean(myChannel);
    const channelLink = hasChannel ? `/channel/${myChannel?.id}` : "/channel/create";
    const channelActionText = hasChannel ? "View your channel" : "Create a channel";
    const isAdminOrModerator = user.role === 1 || user.role === 2;

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setTimeout(() => setView('main'), 200); }}>
            <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer ml-2 hover:opacity-80 transition select-none">
                    <AvatarImage src={avatarUrl || undefined} />

                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {firstLetter}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[300px] bg-[#282828] border-none text-white shadow-xl rounded-xl py-2 mt-2 mr-2">
                {view === 'main' ? (
                    <>
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

                        {isAdminOrModerator && (
                            <>
                                <DropdownMenuItem asChild className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
                                    <Link href="/admin" className="flex items-center w-full">
                                        <div className="mr-4"><ShieldAlert className="w-6 h-6 text-[#FF4444]" /></div>
                                        <span className="text-[#FF4444] font-medium">Admin Panel</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#3e3e3e] my-2" />
                            </>
                        )}

                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                setView('accounts');
                            }}
                            className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white"
                        >
                            <div className="mr-4"><UserIcon className="w-6 h-6 font-light text-[#AAAAAA]" /></div>
                            <span className="flex-1">Switch account</span>
                            <ChevronLeft className="w-5 h-5 text-[#AAAAAA] rotate-180" />
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 text-[15px] focus:bg-[#3e3e3e] focus:text-white">
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
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="flex items-center px-4 py-2 mb-1">
                            <button
                                onClick={() => setView('main')}
                                className="mr-4 p-1 hover:bg-[#3e3e3e] rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>

                            <span className="text-[16px] font-medium">Accounts</span>
                        </div>

                        <DropdownMenuSeparator className="bg-[#3e3e3e] mb-2" />

                        <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                            {sessions.map((acc) => {
                                const isCurrent = acc.id === user.id;

                                return (
                                    <DropdownMenuItem
                                        key={acc.id}
                                        onSelect={(e) => {
                                            if (isCurrent) {
                                                e.preventDefault();
                                            } else {
                                                handleSwitchAccount(acc.id);
                                            }
                                        }}
                                        className="cursor-pointer hover:!bg-[#3e3e3e] py-2.5 px-4 focus:bg-[#3e3e3e] focus:text-white"
                                    >
                                        <div className="w-6 mr-4 flex justify-center">
                                            {isCurrent && <Check className="w-5 h-5 text-white" />}
                                        </div>

                                        <Avatar className="h-9 w-9 mr-3">
                                            <AvatarImage src={acc.avatarUrl || undefined} />

                                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                                                {acc.username?.[0]?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="text-[15px] truncate">{acc.username}</span>
                                            <span className="text-[13px] text-[#AAAAAA] truncate">{acc.email}</span>
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>

                        <DropdownMenuSeparator className="bg-[#3e3e3e] my-2" />

                        <DropdownMenuItem
                            onSelect={handleAddAccount}
                            className="cursor-pointer hover:!bg-[#3e3e3e] py-3 px-4 focus:bg-[#3e3e3e] focus:text-white"
                        >
                            <div className="w-6 mr-4 flex justify-center"></div>
                            <div className="mr-3 p-1 rounded-full bg-[#3e3e3e] flex items-center justify-center h-9 w-9">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[15px]">Add account</span>
                        </DropdownMenuItem>

                        {sessions.length > 1 && (
                            <DropdownMenuItem
                                onSelect={handleLogoutAll}
                                className="cursor-pointer hover:!bg-[#3e3e3e] py-3 px-4 focus:bg-[#3e3e3e] focus:text-white text-[#3ea6ff] hover:text-[#6ebcff]"
                            >
                                <div className="w-6 mr-4 flex justify-center"></div>

                                <div className="mr-3 p-1 flex items-center justify-center h-9 w-9">
                                    <LogOut className="w-5 h-5" />
                                </div>

                                <span className="text-[15px]">Sign out of all accounts</span>
                            </DropdownMenuItem>
                        )}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};