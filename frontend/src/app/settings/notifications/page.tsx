"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetMeQuery, useUpdateUserSettingsMutation } from "@/store/api";

const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${checked ? 'bg-[#3ea6ff]' : 'bg-[#717171]'}`}
    >
        <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`}
        />
    </button>
);

export default function NotificationsSettingsPage() {
    const { data: user, isLoading } = useGetMeQuery();

    const [updateSettings] = useUpdateUserSettingsMutation();

    // Добавили настройку для Live Stream
    const [settings, setSettings] = useState({
        notifyOnNewVideo: true,
        notifyOnVideoReady: true,
        notifyOnCommentReply: true,
        notifyOnMention: true,
        notifyOnLiveStream: true, // <--- НОВОЕ ПОЛЕ
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setSettings({
                notifyOnNewVideo: user.notifyOnNewVideo ?? true,
                notifyOnVideoReady: user.notifyOnVideoReady ?? true,
                notifyOnCommentReply: user.notifyOnCommentReply ?? true,
                notifyOnMention: user.notifyOnMention ?? true,
                notifyOnLiveStream: user.notifyOnLiveStream ?? true, // <--- НОВОЕ ПОЛЕ
            });
        }
    }, [user]);

    const handleToggle = async (key: keyof typeof settings) => {
        const newValue = !settings[key];
        const newSettings = { ...settings, [key]: newValue };

        setSettings(newSettings);
        setIsSaving(true);

        try {
            await updateSettings(newSettings).unwrap();
            toast.success("Settings saved");
        } catch (error) {
            console.error("Failed to save settings", error);
            // Откатываем UI, если сервер выдал ошибку
            setSettings(settings);
            toast.error("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white pt-20 pb-10 px-4 md:px-8">
            <div className="max-w-[800px] mx-auto">
                <h1 className="text-[24px] font-bold mb-1">Notifications</h1>
                <p className="text-[14px] text-[#aaaaaa] mb-8">
                    Choose how and when you want to be notified.
                </p>

                <section className="mb-8">
                    <h2 className="text-[18px] font-medium mb-4 border-b border-[#3f3f3f] pb-2">
                        General
                    </h2>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-white mb-0.5">
                                    Subscriptions
                                </span>
                                <span className="text-[13px] text-[#aaaaaa]">
                                    Notify me about activity from the channels I'm subscribed to.
                                </span>
                            </div>
                            <div className="pt-1">
                                <ToggleSwitch
                                    checked={settings.notifyOnNewVideo}
                                    onChange={() => handleToggle('notifyOnNewVideo')}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        {/* === НОВЫЙ БЛОК ДЛЯ ТРАНСЛЯЦИЙ === */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-white mb-0.5">
                                    Live streams
                                </span>
                                <span className="text-[13px] text-[#aaaaaa]">
                                    Notify me when a channel I'm subscribed to goes live.
                                </span>
                            </div>
                            <div className="pt-1">
                                <ToggleSwitch
                                    checked={settings.notifyOnLiveStream}
                                    onChange={() => handleToggle('notifyOnLiveStream')}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-white mb-0.5">
                                    Video processing
                                </span>
                                <span className="text-[13px] text-[#aaaaaa]">
                                    Notify me when my uploaded video has finished processing and is ready.
                                </span>
                            </div>
                            <div className="pt-1">
                                <ToggleSwitch
                                    checked={settings.notifyOnVideoReady}
                                    onChange={() => handleToggle('notifyOnVideoReady')}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-[18px] font-medium mb-4 border-b border-[#3f3f3f] pb-2">
                        Comments & Activity
                    </h2>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-white mb-0.5">
                                    Replies to my comments
                                </span>
                                <span className="text-[13px] text-[#aaaaaa]">
                                    Notify me when someone replies to my comments.
                                </span>
                            </div>
                            <div className="pt-1">
                                <ToggleSwitch
                                    checked={settings.notifyOnCommentReply}
                                    onChange={() => handleToggle('notifyOnCommentReply')}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-white mb-0.5">
                                    Mentions
                                </span>
                                <span className="text-[13px] text-[#aaaaaa]">
                                    Notify me when others mention my channel.
                                </span>
                            </div>
                            <div className="pt-1">
                                <ToggleSwitch
                                    checked={settings.notifyOnMention}
                                    onChange={() => handleToggle('notifyOnMention')}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}