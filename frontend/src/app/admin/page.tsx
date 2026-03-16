"use client";

import React, { useState } from "react";
import {
    Users, Video, AlertTriangle, PlayCircle,
    MoreVertical, CheckCircle, XCircle, TrendingUp, Activity, Loader2, ArrowRight, ExternalLink,
    ChevronDown, ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useGetAdminStatsQuery, useGetAdminReportsQuery, useReviewReportMutation } from "@/store/api";
import { ReportStatus } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const REPORT_REASONS_MAP: Record<number, string> = {
    0: "Sexual content",
    1: "Violent or repulsive content",
    2: "Hateful or abusive content",
    3: "Harmful or dangerous acts",
    4: "Spam or misleading",
    5: "Scams or fraud"
};

const mockChartData = {
    users: [
        { name: "Mon", value: 12 }, { name: "Tue", value: 19 }, { name: "Wed", value: 15 },
        { name: "Thu", value: 25 }, { name: "Fri", value: 32 }, { name: "Sat", value: 40 }, { name: "Sun", value: 38 }
    ],
    videos: [
        { name: "Mon", value: 5 }, { name: "Tue", value: 8 }, { name: "Wed", value: 6 },
        { name: "Thu", value: 12 }, { name: "Fri", value: 15 }, { name: "Sat", value: 22 }, { name: "Sun", value: 18 }
    ],
    reports: [
        { name: "Mon", value: 2 }, { name: "Tue", value: 5 }, { name: "Wed", value: 3 },
        { name: "Thu", value: 8 }, { name: "Fri", value: 4 }, { name: "Sat", value: 12 }, { name: "Sun", value: 7 }
    ],
    views: [
        { name: "Mon", value: 1200 }, { name: "Tue", value: 1900 }, { name: "Wed", value: 1500 },
        { name: "Thu", value: 2500 }, { name: "Fri", value: 3200 }, { name: "Sat", value: 4500 }, { name: "Sun", value: 4100 }
    ]
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const { data: stats, isLoading: isStatsLoading } = useGetAdminStatsQuery();
    const { data: reports, isLoading: isReportsLoading } = useGetAdminReportsQuery({
        status: ReportStatus.Pending,
        page: 1
    });
    const [reviewReport] = useReviewReportMutation();

    const [activeTab, setActiveTab] = useState<"users" | "videos" | "reports" | "views">("users");

    const [isReportsExpanded, setIsReportsExpanded] = useState(false);

    const handleReview = async (reportId: string, newStatus: ReportStatus, note: string) => {
        try {
            await reviewReport({ id: reportId, status: newStatus, moderatorNote: note }).unwrap();
            toast.success("Report reviewed successfully");
        } catch (error) {
            toast.error("Failed to review report");
        }
    };

    if (isStatsLoading) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    const statCards = [
        {
            id: "users" as const,
            title: "Total Users",
            value: stats?.totalUsers.toLocaleString() || "0",
            change: `+${stats?.newUsersToday || 0} today`,
            trend: "up",
            icon: Users, color: "text-[#3ea6ff]", bg: "bg-[#3ea6ff]/10",
            activeBorder: "border-[#3ea6ff]", chartColor: "#3ea6ff", link: "/admin/users"
        },
        {
            id: "videos" as const,
            title: "Total Videos",
            value: stats?.totalVideos.toLocaleString() || "0",
            change: `+${stats?.newVideosToday || 0} today`,
            trend: "up",
            icon: Video, color: "text-[#2ba640]", bg: "bg-[#2ba640]/10",
            activeBorder: "border-[#2ba640]", chartColor: "#2ba640", link: "/admin/content"
        },
        {
            id: "reports" as const,
            title: "Active Reports",
            value: stats?.pendingReports.toLocaleString() || "0",
            change: "Requires review",
            trend: "neutral",
            icon: AlertTriangle, color: "text-[#FF0000]", bg: "bg-[#FF0000]/10",
            activeBorder: "border-[#FF0000]", chartColor: "#FF0000", link: "/admin/reports"
        },
        {
            id: "views" as const,
            title: "Total Views",
            value: stats?.totalViews.toLocaleString() || "0",
            change: "Across platform",
            trend: "up",
            icon: PlayCircle, color: "text-[#a552e6]", bg: "bg-[#a552e6]/10",
            activeBorder: "border-[#a552e6]", chartColor: "#a552e6", link: "/"
        },
    ];

    const currentChartData = mockChartData[activeTab];
    const currentChartColor = statCards.find(c => c.id === activeTab)?.chartColor || "#3ea6ff";

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full rounded-2xl bg-gradient-to-r from-[#1e293b] via-[#111827] to-[#0F0F0F] border border-[#3F3F3F] p-6 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <Link href="/">
                        <button className="cursor-pointer bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-colors shrink-0 shadow-lg">
                            Go to YouTube
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#3ea6ff]/10 to-transparent pointer-events-none" />
                <Activity className="absolute -right-10 -bottom-16 w-48 h-48 text-[#3ea6ff]/5 pointer-events-none transform -rotate-12" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    const isActive = activeTab === stat.id;

                    return (
                        <div
                            key={stat.id}
                            onClick={() => setActiveTab(stat.id)}
                            className={`bg-[#212121] border-2 rounded-2xl p-4 flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-[#252525] w-full cursor-pointer relative overflow-hidden ${
                                isActive ? stat.activeBorder : "border-[#3F3F3F]"
                            }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                            )}

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className={`p-2.5 rounded-xl ${stat.bg} transition-colors shadow-inner`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold tracking-wide ${stat.trend === "neutral" ? "bg-[#3F3F3F] text-[#AAAAAA]" : "bg-green-500/10 text-green-500"}`}>
                                        {stat.trend !== "neutral" && <TrendingUp className="w-4 h-4" />}
                                        <span>{stat.change}</span>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(stat.link); }}
                                        className="p-1.5 rounded-md hover:bg-[#3F3F3F] text-[#AAAAAA] hover:text-white transition-colors"
                                        title={`Go to ${stat.title}`}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="text-3xl font-black text-white mb-1.5 tracking-tight">{stat.value}</div>
                                <h3 className="text-[#AAAAAA] text-sm font-medium uppercase tracking-wider">{stat.title}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>


            <div className="bg-[#212121] border border-[#3F3F3F] rounded-2xl p-4 md:p-4 shadow-xl w-full">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight capitalize">{activeTab} Activity (Last 7 Days)</h2>
                        <p className="text-[#AAAAAA] text-sm mt-1">Visualizing {activeTab} growth over the past week.</p>
                    </div>
                </div>

                <div className="h-[288px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={currentChartColor} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={currentChartColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#3F3F3F" vertical={false} />

                            <XAxis
                                dataKey="name"
                                stroke="#AAAAAA"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />

                            <YAxis
                                stroke="#AAAAAA"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            />

                            <Tooltip
                                contentStyle={{ backgroundColor: "#282828", borderColor: "#3F3F3F", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                                itemStyle={{ color: currentChartColor, fontWeight: "bold" }}
                            />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={currentChartColor}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-6">
                {!isReportsExpanded ? (
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsReportsExpanded(true)}
                            className="flex items-center gap-2 text-[#AAAAAA] hover:text-white text-xs font-medium cursor-pointer"
                        >
                            <ChevronDown className="w-4 h-4" />
                            <span>show Action Required: Reports</span>
                        </button>
                    </div>
                    ) : (
                    <>

                <div className="bg-[#212121] border border-[#3F3F3F] rounded-2xl overflow-hidden flex flex-col w-full shadow-xl animate-fade-in">
                    <div className="p-6 md:p-8 border-b border-[#3F3F3F] flex items-center justify-between bg-gradient-to-r from-[#1f1f1f] to-[#212121]">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Action Required: Reports</h2>
                            <p className="text-[14px] text-[#AAAAAA]">Content flagged by users that requires moderator review.</p>
                        </div>

                        <Link href="/admin/reports">
                            <button className="text-[#3ea6ff] text-sm font-medium hover:bg-[#3ea6ff]/10 px-5 py-2.5 rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#3ea6ff]/30">
                                View All
                            </button>
                        </Link>
                    </div>


                    <div className="overflow-x-auto w-full">
                        {isReportsLoading ? (
                            <div className="p-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#AAAAAA]" /></div>
                        ) : reports && reports.length > 0 ? (
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-[#3F3F3F] bg-[#181818]/80">
                                        <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider w-[35%]">Target Content</th>
                                        <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Reason</th>
                                        <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Reported By</th>
                                        <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Time</th>
                                        <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider text-right pr-8">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#3F3F3F]">

                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-[#272727] transition-colors group">
                                        <td className="p-5 flex items-center gap-4">
                                            <div className="w-20 h-12 bg-black rounded-md overflow-hidden shrink-0 border border-[#3F3F3F]">
                                                <img src={report.video.thumbnailUrl || "/placeholder.jpg"} alt="thumb" className="w-full h-full object-cover" />
                                            </div>

                                            <a href={`/watch/${report.video.id}`} target="_blank" className="text-[15px] text-white font-medium line-clamp-2 hover:text-[#3ea6ff] transition-colors">
                                                {report.video.title}
                                            </a>
                                        </td>

                                        <td className="p-5">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-bold text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20">
                                                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                                {REPORT_REASONS_MAP[Number(report.reason)] || "Unknown Reason"}
                                            </span>
                                        </td>

                                        <td className="p-5 text-[14px] font-medium text-[#AAAAAA] hover:text-white cursor-pointer transition-colors">
                                            @{report.reporter.username}
                                        </td>

                                        <td className="p-5 text-[14px] text-[#888888]">
                                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                        </td>

                                        <td className="p-5 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleReview(report.id, ReportStatus.Resolved, "Report rejected, video is fine.")} className="p-2.5 hover:bg-green-500/20 text-green-500 rounded-full transition-colors cursor-pointer" title="Approve Video (Reject Report)">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>

                                                <button onClick={() => handleReview(report.id, ReportStatus.VideoRemoved, "Video violates terms of service.")} className="p-2.5 hover:bg-red-500/20 text-[#FF4444] rounded-full transition-colors cursor-pointer" title="Delete Video">
                                                    <XCircle className="w-5 h-5" />
                                                </button>

                                                <button className="p-2.5 hover:bg-[#3F3F3F] text-[#AAAAAA] hover:text-white rounded-full transition-colors cursor-pointer">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-16 flex flex-col items-center justify-center text-[#AAAAAA]">
                                <CheckCircle className="w-16 h-16 text-green-500/50 mb-4" />
                                <span className="text-xl font-medium text-white">All caught up!</span>
                                <span className="text-sm mt-1">No pending reports require your attention.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setIsReportsExpanded(false)}
                        className="flex items-center gap-2 text-[#AAAAAA] hover:text-white text-xs font-medium cursor-pointer"
                    >
                        <ChevronUp className="w-4 h-4" />
                        <span>hide Reports</span>
                    </button>
                </div>
            </>
            )}
        </div>
</div>
);
}