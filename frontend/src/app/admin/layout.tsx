"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Video,
    Flag, Settings, LogOut, ShieldAlert, Menu, Search, Mic
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGetMeQuery, useGetAdminStatsQuery } from "@/store/api";
import { UserRole } from "@/types";

const SYSTEM_LINKS = [
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Back to YouTube", href: "/", icon: LogOut },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { data: user } = useGetMeQuery();
    const { data: stats } = useGetAdminStatsQuery();

    const ADMIN_LINKS = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Content", href: "/admin/content", icon: Video },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Reports", href: "/admin/reports", icon: Flag, badge: stats?.pendingReports || 0 },
    ];

    const getRoleName = (role?: UserRole) => {
        if (role === UserRole.Admin) return "Administrator";
        if (role === UserRole.Moderator) return "Moderator";
        return "Unknown";
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white flex">
            <aside className={`sticky top-0 h-screen shrink-0 z-50 bg-[#212121] border-r border-[#3F3F3F] flex flex-col transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-[72px]"}`}>
                <div className="h-[72px] flex items-center px-4 border-b border-[#3F3F3F] shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-[#3F3F3F] rounded-full transition-colors cursor-pointer mr-3"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </button>

                    {isSidebarOpen && (
                        <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
                            <ShieldAlert className="w-6 h-6 text-[#FF0000]" />
                            <span>Admin Panel</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 custom-scrollbar">
                    <div className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wider mb-2 px-3 mt-2">
                        {isSidebarOpen ? "Moderation" : "Mod"}
                    </div>

                    {ADMIN_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link key={link.name} href={link.href}>
                                <div className={`flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? "bg-[#3F3F3F] text-white font-medium" : "text-[#AAAAAA] hover:bg-[#272727] hover:text-white"}`}>
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#3ea6ff]" : ""}`} />
                                    {isSidebarOpen && (
                                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                                            <span className="truncate">{link.name}</span>

                                            {(link.badge ?? 0) > 0 && (
                                                <span className="bg-[#FF0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}

                    <div className="my-4 border-t border-[#3F3F3F]" />

                    <div className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wider mb-2 px-3">
                        {isSidebarOpen ? "System" : "Sys"}
                    </div>

                    {SYSTEM_LINKS.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.name} href={link.href}>
                                <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-[#AAAAAA] hover:bg-[#272727] hover:text-white">
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {isSidebarOpen && <span className="truncate">{link.name}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-[#3F3F3F] flex items-center gap-3 bg-[#181818]">
                    <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={user?.avatarUrl || undefined} />

                        <AvatarFallback className="bg-purple-600 text-white font-bold">
                            {user?.username?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                    </Avatar>

                    {isSidebarOpen && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-white truncate">
                                {user?.username || "Loading..."}
                            </span>

                            <span className="text-xs text-[#AAAAAA] truncate">
                                Role: {getRoleName(user?.role)}
                            </span>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 min-h-screen">
                <header className="h-[72px] shrink-0 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#3F3F3F] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40">
                    <h1 className="text-[20px] font-semibold text-white capitalize hidden md:block min-w-[150px]">
                        {pathname.split("/").pop() === "admin" ? "Dashboard" : pathname.split("/").pop()}
                    </h1>

                    <div className="flex items-center flex-1 max-w-[600px] md:ml-10">
                        <div className="flex items-center w-full h-10 border border-[#3F3F3F] bg-[#121212] rounded-l-full px-4 focus-within:border-[#1c62b9]">
                            <Search className="w-4 h-4 text-[#AAAAAA] mr-2 hidden sm:block" />

                            <input
                                type="text"
                                placeholder="Search in admin panel..."
                                className="w-full bg-transparent outline-none text-white text-[15px] font-normal"
                            />
                        </div>

                        <button className="h-10 w-16 bg-[#222222] border border-l-0 border-[#3F3F3F] rounded-r-full flex items-center justify-center hover:bg-[#303030] transition-colors cursor-pointer shrink-0">
                            <Search className="w-5 h-5 text-white font-thin" />
                        </button>

                        <button className="h-10 w-10 bg-[#181818] rounded-full flex items-center justify-center hover:bg-[#303030] transition-colors ml-2 sm:ml-4 cursor-pointer shrink-0">
                            <Mic className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 ml-auto pl-4">
                        <div className="text-sm text-[#AAAAAA] hidden lg:block">
                            Status: <span className="text-green-500 font-medium">Operational</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 w-full p-6 lg:p-8 xl:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}