"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { useCreateChannelMutation, useLazyGetMyChannelQuery } from "@/store/api";
import { useDispatch } from "react-redux";

export default function CreateChannelPage() {
    const dispatch = useDispatch();

    const router = useRouter();
    const [createChannel, { isLoading }] = useCreateChannelMutation();
    const [triggerGetMyChannel] = useLazyGetMyChannelQuery();

    const [name, setName] = useState("");
    const [handle, setHandle] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleCreate = async () => {
        if (!name || !handle) return;

        try {
            await createChannel({
                name: name.trim(),
                handle: handle.trim().toLowerCase(),
                description: ""
            }).unwrap();

            const channelData = await triggerGetMyChannel(undefined, false).unwrap();

            if (channelData?.id) {
                router.push(`/channel/${channelData.id}`);
                router.refresh();
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error("Ошибка:", err);
            alert(err?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
            <div className="bg-[#212121] rounded-2xl w-full max-w-[480px] p-6 sm:p-8 shadow-2xl border border-[#303030]">
                <h1 className="text-[22px] font-bold text-white mb-8">How you'll appear</h1>

                <div className="flex flex-col items-center mb-8">
                    <div
                        className="relative w-32 h-32 rounded-full bg-[#121212] flex items-center justify-center cursor-pointer group overflow-hidden mb-4 border border-[#303030] transition-all hover:border-[#404040]"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Avatar preview" fill className="object-cover" />
                        ) : (
                            <Camera className="w-10 h-10 text-white z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-0 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-white z-10" />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="text-[#3ea6ff] text-[14px] font-medium cursor-pointer hover:text-[#6ebcff] transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Select picture
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageChange}
                    />
                </div>

                <div className="space-y-6">
                    {}
                    <div className="space-y-1 relative group">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-transparent border-[#717171] focus-visible:border-[#3ea6ff] focus-visible:ring-0 text-white pt-5 pb-2 h-14 rounded-[8px] transition-colors"
                            placeholder=" "
                            id="channelName"
                        />
                        <label
                            htmlFor="channelName"
                            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                                name
                                    ? "text-[12px] top-1.5 text-[#3ea6ff]"
                                    : "text-[16px] top-4 text-[#AAAAAA] group-focus-within:text-[12px] group-focus-within:top-1.5 group-focus-within:text-[#3ea6ff]"
                            }`}
                        >
                            Name
                        </label>
                    </div>

                    {}
                    <div className="space-y-1 relative group">
                        <Input
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            className="bg-transparent border-[#717171] focus-visible:border-[#3ea6ff] focus-visible:ring-0 text-white pt-5 pb-2 h-14 rounded-[8px] transition-colors"
                            placeholder=" "
                            id="channelHandle"
                        />
                        <label
                            htmlFor="channelHandle"
                            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                                handle
                                    ? "text-[12px] top-1.5 text-[#3ea6ff]"
                                    : "text-[16px] top-4 text-[#AAAAAA] group-focus-within:text-[12px] group-focus-within:top-1.5 group-focus-within:text-[#3ea6ff]"
                            }`}
                        >
                            Handle
                        </label>
                        {handle && (
                            <span className="absolute right-3 top-4 text-[12px] text-[#AAAAAA]">
                                @{handle.toLowerCase().replace(/\s+/g, '')}
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-[12px] text-[#AAAAAA] mt-8 leading-relaxed">
                    By clicking Create Channel you agree to VidFlow's Terms of Service. Changes made to your name and profile picture are visible only on VidFlow.
                </p>

                <div className="flex justify-end gap-3 mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="text-white hover:bg-white/10 rounded-full px-5 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim() || !handle.trim()}
                        className="bg-[#3ea6ff] text-[#0F0F0F] hover:bg-[#6ebcff] disabled:bg-[#303030] disabled:text-[#717171] rounded-full px-5 font-medium min-w-[140px] transition-all"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                <span>Creating...</span>
                            </div>
                        ) : (
                            "Create channel"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}