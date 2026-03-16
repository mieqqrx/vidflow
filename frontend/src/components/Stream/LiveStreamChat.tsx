"use client";

import React from "react";
import { ChevronDown, MoreVertical, Smile, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LiveStreamChat({
                                           stream,
                                           messages,
                                           currentUser,
                                           isEnded,
                                           newMessage,
                                           setNewMessage,
                                           handleSendMessage,
                                           chatContainerRef
                                       }: any) {
    return (
        <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 h-[500px] lg:h-[calc(100vh-110px)] max-h-[850px] flex flex-col border border-[#3F3F3F] rounded-xl bg-[#0F0F0F] overflow-hidden lg:sticky lg:top-[90px] shadow-2xl">
            <div className="px-4 py-3 border-b border-[#3F3F3F] flex items-center justify-between bg-[#0F0F0F] z-10 shrink-0">
                <button className="flex items-center gap-2 hover:bg-[#272727] px-3 py-1.5 rounded-full transition-colors cursor-pointer text-[15px] font-medium">
                    Live chat
                    <ChevronDown className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#272727] rounded-full transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5 text-white" />
                </button>
            </div>

            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative custom-scrollbar scroll-smooth bg-[#0F0F0F]"
            >
                {!stream.chatEnabled ? (
                    <div className="h-full flex items-center justify-center text-[#AAAAAA]">
                        Chat is disabled for this stream.
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[#AAAAAA]">
                        {isEnded ? "Chat history is empty." : "Welcome to the live chat! Say hello."}
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMsgOwner = msg.userId === stream.channelId;
                        const isCurrentUser = msg.userId === currentUser?.id;

                        return (
                            <div key={msg.id} className="flex gap-3 text-[14px] group hover:bg-[#1f1f1f] p-1.5 -mx-1.5 rounded-lg transition-colors">
                                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                    <AvatarImage src={msg.avatarUrl || undefined} />
                                    <AvatarFallback className={`${isMsgOwner ? 'bg-[#FFD700] text-black' : 'bg-purple-600 text-white'} text-[10px]`}>
                                        {msg.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 leading-snug">
                                    <span className={`font-medium mr-2 ${isMsgOwner ? 'bg-[#FFD700] text-black px-1.5 py-0.5 rounded-sm text-[12px]' : isCurrentUser ? 'text-[#3ea6ff]' : 'text-[#AAAAAA]'}`}>
                                        {msg.username}
                                    </span>
                                    <span className="text-white break-words">{msg.text}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {stream.chatEnabled && (
                <div className="p-4 border-t border-[#3F3F3F] bg-[#0F0F0F] z-10 shrink-0">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={currentUser?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                                {currentUser?.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                        </Avatar>

                        <span className="text-[13px] text-[#AAAAAA] font-medium">
                            {currentUser ? (isEnded ? `Signed in as ${currentUser.username}` : `Chat publicly as ${currentUser.username}`) : "Sign in to chat"}
                        </span>
                    </div>

                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!currentUser || isEnded}
                            placeholder={isEnded ? "Chat is closed for this stream" : currentUser ? "Say something..." : "Sign in to chat"}
                            className="w-full bg-[#272727] text-white text-[14px] px-4 py-2.5 rounded-full pr-24 outline-none focus:ring-1 focus:ring-[#3ea6ff] transition-shadow placeholder:text-[#AAAAAA] disabled:opacity-50"
                        />

                        <div className="absolute right-1 top-1 flex items-center gap-1">
                            <button type="button" disabled={isEnded} className="p-1.5 hover:bg-[#3F3F3F] rounded-full transition-colors cursor-pointer text-[#AAAAAA] hover:text-white disabled:opacity-50">
                                <Smile className="w-5 h-5" />
                            </button>

                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !currentUser || isEnded}
                                className="p-1.5 bg-[#3ea6ff] text-black rounded-full transition-all cursor-pointer disabled:opacity-50 disabled:bg-[#3F3F3F] disabled:text-[#AAAAAA]"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}