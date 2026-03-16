"use client";

import React, { useState } from "react";
import { Loader2, Trash2, PauseCircle, Settings, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import HistoryVideoCard from "@/components/History/HistoryVideoCard";
import {
    useGetWatchHistoryQuery,
    useDeleteHistoryItemMutation,
    useClearHistoryMutation
} from "@/store/api";
import { format, isToday, isYesterday } from "date-fns";
import { WatchHistoryItem } from "@/types";

export default function HistoryPage() {
    const { data: historyItems, isLoading } = useGetWatchHistoryQuery(1);
    const [deleteItem] = useDeleteHistoryItemMutation();
    const [clearHistory, { isLoading: isClearing }] = useClearHistoryMutation();

    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleDeleteItem = async (videoId: string) => {
        try {
            await deleteItem(videoId).unwrap();
            toast.success("Item removed from watch history");
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    const handleClearAllHistory = async () => {
        try {
            await clearHistory().unwrap();
            setIsClearModalOpen(false);
            toast.success("Watch history cleared");
        } catch (error) {
            toast.error("Failed to clear history");
        }
    };

    const groupedHistory = React.useMemo(() => {
        if (!historyItems) return {};

        return historyItems.reduce((acc: Record<string, WatchHistoryItem[]>, item) => {
            const date = new Date(item.watchedAt);
            let groupKey = "";

            if (isToday(date)) {
                groupKey = "Today";
            } else if (isYesterday(date)) {
                groupKey = "Yesterday";
            } else {
                groupKey = format(date, "MMM d, yyyy");
            }

            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {});
    }, [historyItems]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-[72px]">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    const isEmpty = !historyItems || historyItems.length === 0;

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white pt-[72px] px-4 md:px-8 lg:px-12 xl:px-24">
            <div className="max-w-[1400px] mx-auto flex flex-col-reverse lg:flex-row gap-10 lg:gap-16 pt-6">
                <div className="flex-1 min-w-0 pb-20">
                    <h1 className="text-[24px] font-bold mb-6">Watch history</h1>

                    {isEmpty ? (
                        <div className="text-center mt-20 flex flex-col items-center">
                            <div className="w-24 h-24 bg-[#212121] rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-10 h-10 text-[#aaaaaa]" />
                            </div>
                            <h2 className="text-xl font-medium text-white mb-2">This list has no videos.</h2>
                            <p className="text-[#aaaaaa]">Videos you watch will show up here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {Object.entries(groupedHistory).map(([dateKey, items]) => (
                                <div key={dateKey}>
                                    <h3 className="text-[16px] font-medium text-white mb-4">{dateKey}</h3>
                                    <div className="flex flex-col gap-2">
                                        {items.map((item) => (
                                            <HistoryVideoCard
                                                key={item.videoId}
                                                item={item}
                                                onRemove={handleDeleteItem}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[320px] shrink-0 pt-2 lg:pt-14">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-[90px]">
                        <div className="relative mb-2">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aaaaaa]" />
                            <input
                                type="text"
                                placeholder="Search watch history"
                                className="w-full bg-transparent border-b border-[#3f3f3f] focus:border-white outline-none pl-8 py-2 text-[14px] transition-colors placeholder:text-[#aaaaaa]"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setIsClearModalOpen(true)}
                                disabled={isEmpty}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#272727] text-[#aaaaaa] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="text-[14px] font-medium">Clear all watch history</span>
                            </button>

                            <button className="flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#272727] text-[#aaaaaa] hover:text-white transition-colors cursor-pointer">
                                <PauseCircle className="w-5 h-5" />
                                <span className="text-[14px] font-medium">Pause watch history</span>
                            </button>

                            <button className="flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#272727] text-[#aaaaaa] hover:text-white transition-colors cursor-pointer">
                                <Settings className="w-5 h-5" />
                                <span className="text-[14px] font-medium">Manage all history</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
                <DialogContent className="bg-[#212121] border-none text-white sm:max-w-[400px] p-6 rounded-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-medium">Clear watch history?</DialogTitle>
                    </DialogHeader>

                    <div className="text-[14px] text-[#aaaaaa] py-4 leading-relaxed">
                        Your watch history will be cleared from all YouTube apps on all devices.
                        Your video recommendations will be reset, but may still be influenced by activity on other Google products.
                    </div>

                    <DialogFooter className="flex justify-end gap-3 mt-2 border-none">
                        <Button
                            variant="ghost"
                            onClick={() => setIsClearModalOpen(false)}
                            className="hover:bg-[#3f3f3f] text-white rounded-full font-medium"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleClearAllHistory}
                            disabled={isClearing}
                            className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 bg-transparent rounded-full font-medium transition-colors"
                        >
                            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear watch history"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}