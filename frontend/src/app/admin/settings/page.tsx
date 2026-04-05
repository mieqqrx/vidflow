"use client";

import React, { useState } from "react";
import {
    Settings, Shield, Bell, Database,
    Save, Loader2, Globe, Server, Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState({
        platformName: "VidFlow",
        supportEmail: "support@vidflow.com",
        maintenanceMode: false,
        maxUploadSize: "500",
        autoModeration: true,
        notifyOnReports: true,
        strictRegistration: false
    });

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Settings saved successfully");
        }, 800);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#212121] p-6 rounded-2xl border border-[#3F3F3F] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-[#3ea6ff]" />
                        System Settings
                    </h1>

                    <p className="text-[#AAAAAA] text-sm mt-1">Configure global platform parameters and moderation rules.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-bold px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer w-full md:w-auto"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium cursor-pointer ${activeTab === "general" ? "bg-[#3F3F3F] text-white" : "text-[#AAAAAA] hover:bg-[#212121] hover:text-white"}`}
                    >
                        <Globe className="w-5 h-5" />
                        General
                    </button>

                    <button
                        onClick={() => setActiveTab("moderation")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium cursor-pointer ${activeTab === "moderation" ? "bg-[#3F3F3F] text-white" : "text-[#AAAAAA] hover:bg-[#212121] hover:text-white"}`}
                    >
                        <Shield className="w-5 h-5" />
                        Moderation
                    </button>

                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium cursor-pointer ${activeTab === "notifications" ? "bg-[#3F3F3F] text-white" : "text-[#AAAAAA] hover:bg-[#212121] hover:text-white"}`}
                    >
                        <Bell className="w-5 h-5" />
                        Admin Alerts
                    </button>

                    <button
                        onClick={() => setActiveTab("system")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium cursor-pointer ${activeTab === "system" ? "bg-[#3F3F3F] text-white" : "text-[#AAAAAA] hover:bg-[#212121] hover:text-white"}`}
                    >
                        <Server className="w-5 h-5" />
                        System Details
                    </button>
                </div>

                <div className="flex-1 bg-[#212121] rounded-2xl border border-[#3F3F3F] shadow-xl p-6 md:p-8">
                    {activeTab === "general" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#3F3F3F] pb-4">General Settings</h2>

                            <div className="space-y-6 max-w-2xl">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#AAAAAA]">Platform Name</label>

                                    <input
                                        type="text"
                                        name="platformName"
                                        value={settings.platformName}
                                        onChange={handleChange}
                                        className="bg-[#121212] border border-[#3F3F3F] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors"
                                    />

                                    <p className="text-xs text-[#717171]">This name is displayed in emails and meta tags.</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#AAAAAA]">Support Email</label>

                                    <input
                                        type="email"
                                        name="supportEmail"
                                        value={settings.supportEmail}
                                        onChange={handleChange}
                                        className="bg-[#121212] border border-[#3F3F3F] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-2 pt-4">
                                    <label className="text-sm font-medium text-[#AAAAAA]">Max Upload Size (MB)</label>

                                    <input
                                        type="number"
                                        name="maxUploadSize"
                                        value={settings.maxUploadSize}
                                        onChange={handleChange}
                                        className="bg-[#121212] border border-[#3F3F3F] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "moderation" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#3F3F3F] pb-4">Security & Moderation</h2>

                            <div className="space-y-6 max-w-2xl">
                                <label className="flex items-start gap-4 p-4 rounded-xl border border-[#3F3F3F] bg-[#181818] cursor-pointer hover:border-[#3ea6ff]/50 transition-colors">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" name="autoModeration" checked={settings.autoModeration} onChange={handleChange} className="sr-only" />

                                        <div className={`w-10 h-6 rounded-full transition-colors ${settings.autoModeration ? 'bg-[#3ea6ff]' : 'bg-[#3F3F3F]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.autoModeration ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-white text-[15px]">Auto-Moderation AI</div>
                                        <div className="text-sm text-[#AAAAAA] mt-1">Automatically flag videos with explicit content during the processing phase.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 rounded-xl border border-[#3F3F3F] bg-[#181818] cursor-pointer hover:border-[#3ea6ff]/50 transition-colors">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" name="strictRegistration" checked={settings.strictRegistration} onChange={handleChange} className="sr-only" />

                                        <div className={`w-10 h-6 rounded-full transition-colors ${settings.strictRegistration ? 'bg-[#3ea6ff]' : 'bg-[#3F3F3F]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.strictRegistration ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-white text-[15px]">Strict Registration</div>
                                        <div className="text-sm text-[#AAAAAA] mt-1">Require email verification for new accounts before they can upload videos or comment.</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#3F3F3F] pb-4">Admin Alerts</h2>

                            <div className="space-y-6 max-w-2xl">
                                <label className="flex items-start gap-4 p-4 rounded-xl border border-[#3F3F3F] bg-[#181818] cursor-pointer hover:border-[#3ea6ff]/50 transition-colors">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" name="notifyOnReports" checked={settings.notifyOnReports} onChange={handleChange} className="sr-only" />

                                        <div className={`w-10 h-6 rounded-full transition-colors ${settings.notifyOnReports ? 'bg-[#3ea6ff]' : 'bg-[#3F3F3F]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.notifyOnReports ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-white text-[15px]">Report Notifications</div>
                                        <div className="text-sm text-[#AAAAAA] mt-1">Send an email to admins when a video receives more than 5 reports.</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "system" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#3F3F3F] pb-4">System Status</h2>

                            <div className="space-y-6 max-w-2xl">
                                <label className="flex items-start gap-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:border-yellow-500/50 transition-colors">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="sr-only" />

                                        <div className={`w-10 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-yellow-500' : 'bg-[#3F3F3F]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-yellow-500 text-[15px]">Maintenance Mode</div>
                                        <div className="text-sm text-[#AAAAAA] mt-1">Disable user logins and video uploads. The site will show a "Under Construction" page.</div>
                                    </div>
                                </label>

                                <div className="mt-8 border-t border-[#3F3F3F] pt-6">
                                    <h3 className="text-lg font-bold text-[#FF4444] mb-2 flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Danger Zone
                                    </h3>

                                    <p className="text-sm text-[#AAAAAA] mb-4">Actions here are irreversible. Please proceed with caution.</p>

                                    <button className="flex items-center gap-2 bg-[#FF4444]/10 text-[#FF4444] hover:bg-[#FF4444]/20 border border-[#FF4444]/20 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                        Clear Cache & Temp Files
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}