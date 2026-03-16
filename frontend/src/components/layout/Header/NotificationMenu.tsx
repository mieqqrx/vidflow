"use client";

import React, { useState } from "react";
import { Check, Settings, Trash2, ListChecks, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation,
    useDeleteMultipleNotificationsMutation
} from "@/store/api";

import { NotificationItem, NotificationType } from "@/types";
import { BellIcon } from "@/components/icons/BellIcon";

import { fixUrl } from "@/utils/fixUrl";

export default function NotificationMenu() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const { data: unreadData } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });
    const { data: notifications = [], isLoading } = useGetNotificationsQuery(1, { skip: !isOpen });

    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();
    const [deleteAllNotifications] = useDeleteAllNotificationsMutation();
    const [deleteMultiple] = useDeleteMultipleNotificationsMutation();

    const unreadCount = unreadData?.count || 0;

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setIsEditMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleNotificationClick = async (notification: NotificationItem) => {
        if (!notification.isRead) {
            try {
                await markAsRead(notification.id).unwrap();
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        }

        setIsOpen(false);

        if (notification.videoId) {
            const isShortVideo = notification.type === NotificationType.NewShort || notification.isShort;

            if (isShortVideo) {
                router.push(`/shorts/${notification.videoId}`);
            } else {
                router.push(`/watch/${notification.videoId}`);
            }
        } else if (notification.channelId) {
            router.push(`/channel/${notification.channelId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteNotification(id).unwrap();
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        try {
            await deleteMultiple(Array.from(selectedIds)).unwrap();
            toast.success(`${selectedIds.size} notifications deleted`);
            setSelectedIds(new Set());
            setIsEditMode(false);
        } catch (error) {
            toast.error("Failed to delete notifications");
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllNotifications().unwrap();
            toast.success("All notifications deleted");
            setIsEditMode(false);
        } catch (error) {
            toast.error("Failed to delete all notifications");
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white rounded-full hover:bg-[#272727] w-10 h-10 transition-colors outline-none">
                    <BellIcon className="w-[22px] h-[22px]" />

                    {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-[#cc0000] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0F0F0F]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[360px] max-w-[calc(100vw-20px)] bg-[#212121] border-[#3f3f3f] text-white rounded-xl shadow-2xl p-0 overflow-hidden">

                <div className="flex items-center justify-between p-3 px-4 border-b border-[#3f3f3f] min-h-[56px]">
                    {!isEditMode ? (
                        <>
                            <h3 className="text-[16px] font-normal">Notifications</h3>
                            <div className="flex gap-1">
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="icon" onClick={handleMarkAllAsRead} className="h-8 w-8 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full" title="Mark all as read">
                                        <Check className="w-5 h-5" />
                                    </Button>
                                )}

                                {notifications.length > 0 && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)} className="h-8 w-8 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full" title="Edit notifications">
                                        <ListChecks className="w-4 h-4" />
                                    </Button>
                                )}

                                <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); router.push("/settings/notifications"); }} className="h-8 w-8 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full" title="Settings">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-[14px] font-medium text-[#aaaaaa]">
                                Selected: <span className="text-white">{selectedIds.size}</span>
                            </h3>
                            <div className="flex gap-1 items-center">
                                {selectedIds.size > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleDeleteSelected} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2 font-medium">
                                        Delete
                                    </Button>
                                )}

                                <Button variant="ghost" size="sm" onClick={handleDeleteAll} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2 font-medium">
                                    Delete All
                                </Button>

                                <Button variant="ghost" size="icon" onClick={() => { setIsEditMode(false); setSelectedIds(new Set()); }} className="h-8 w-8 ml-1 text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f] rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col relative">
                    {isLoading ? (
                        <div className="p-8 text-center text-[#aaaaaa] text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-[#aaaaaa] flex flex-col items-center">
                            <BellIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-[15px] font-medium text-white mb-1">Your notifications live here</p>
                            <p className="text-[13px]">Subscribe to your favorite channels to get notified about their latest videos.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
                            const firstLetter = notification.actorName?.[0]?.toUpperCase() || "Y";
                            const isChecked = selectedIds.has(notification.id);

                            const isShortVideo = notification.type === NotificationType.NewShort || notification.isShort;
                            const thumbnailWidth = isShortVideo ? "w-[27px]" : "w-[86px]";

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (isEditMode) {
                                            toggleSelection(notification.id);
                                        } else {
                                            handleNotificationClick(notification);
                                        }
                                    }}
                                    className={`flex p-4 cursor-pointer hover:bg-[#3f3f3f]/80 transition-colors border-b border-[#3f3f3f]/50 last:border-0 relative group ${
                                        !notification.isRead ? "bg-[#272727]/80" : ""
                                    }`}
                                >
                                    {isEditMode && (
                                        <div className="flex items-center justify-center pr-4">
                                            <Checkbox
                                                checked={isChecked}
                                                className="border-[#aaaaaa] data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff] rounded-sm w-4 h-4"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-1 gap-4 overflow-hidden">
                                        <Avatar className="h-12 w-12 shrink-0 mt-1">
                                            {}
                                            <AvatarImage src={fixUrl(notification.actorAvatarUrl) || undefined} />

                                            <AvatarFallback className="bg-purple-600 text-white">
                                                {firstLetter}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 flex flex-col min-w-0 pr-4">
                                            <div className="text-[14px] text-white leading-snug line-clamp-3 mb-1">
                                                {notification.message}
                                            </div>

                                            <div className="text-[12px] text-[#aaaaaa]">
                                                {timeAgo}
                                            </div>
                                        </div>
                                    </div>

                                    {notification.thumbnailUrl && (
                                        <div className={`${thumbnailWidth} h-[48px] shrink-0 rounded overflow-hidden bg-black ml-2 mt-1 flex justify-center`}>
                                            <img
                                                src={fixUrl(notification.thumbnailUrl) || ""}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {!notification.isRead && !isEditMode && (
                                        <div className="w-1.5 h-1.5 bg-[#3ea6ff] rounded-full mt-4 ml-1 shrink-0" />
                                    )}

                                    {!isEditMode && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-[#212121]/90 backdrop-blur-sm p-1 rounded-full shadow-lg">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-[#aaaaaa] hover:text-red-400 hover:bg-[#3f3f3f] rounded-full"
                                                onClick={(e) => handleDeleteOne(e, notification.id)}
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #717171; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #aaaaaa; }
            `}</style>
        </DropdownMenu>
    );
}