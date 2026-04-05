"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertTriangle, MessageSquare, ExternalLink, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useGetAdminReportsQuery, useReviewReportMutation } from "@/store/api";
import { ReportStatus } from "@/types";

const REPORT_REASONS_MAP: Record<number, string> = {
    0: "Sexual content",
    1: "Violent or repulsive content",
    2: "Hateful or abusive content",
    3: "Harmful or dangerous acts",
    4: "Spam or misleading",
    5: "Scams or fraud"
};

export default function AdminReportsPage() {
    const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(ReportStatus.Pending);
    const [page, setPage] = useState(1);

    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [moderatorNote, setModeratorNote] = useState("");
    const [actionType, setActionType] = useState<ReportStatus.Resolved | ReportStatus.VideoRemoved | null>(null);

    const { data: reports, isLoading } = useGetAdminReportsQuery({ status: statusFilter, page });
    const [reviewReport, { isLoading: isReviewing }] = useReviewReportMutation();

    const handleQuickAction = async (reportId: string, status: ReportStatus) => {
        try {
            await reviewReport({ id: reportId, status }).unwrap();
            toast.success(status === ReportStatus.Resolved ? "Report resolved (Video kept)" : "Video removed successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update report");
        }
    };

    const openNoteModal = (reportId: string, action: ReportStatus.Resolved | ReportStatus.VideoRemoved) => {
        setSelectedReportId(reportId);
        setActionType(action);
        setModeratorNote("");
        setNoteModalOpen(true);
    };

    const submitReviewWithNote = async () => {
        if (!selectedReportId || actionType === null) return;

        try {
            await reviewReport({
                id: selectedReportId,
                status: actionType,
                moderatorNote: moderatorNote.trim() !== "" ? moderatorNote.trim() : undefined
            }).unwrap();

            toast.success("Report reviewed successfully");
            setNoteModalOpen(false);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update report");
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#212121] p-6 rounded-2xl border border-[#3F3F3F] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Reports Management</h1>
                    <p className="text-[#AAAAAA] text-sm mt-1">Review user reports and take moderation actions.</p>
                </div>

                <div className="flex items-center gap-2 bg-[#121212] p-1 rounded-lg border border-[#3F3F3F]">
                    <button
                        onClick={() => { setStatusFilter(undefined); setPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${statusFilter === undefined ? "bg-[#3F3F3F] text-white" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        All
                    </button>

                    <button
                        onClick={() => { setStatusFilter(ReportStatus.Pending); setPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${statusFilter === ReportStatus.Pending ? "bg-yellow-500/20 text-yellow-500" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Pending
                    </button>

                    <button
                        onClick={() => { setStatusFilter(ReportStatus.Resolved); setPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${statusFilter === ReportStatus.Resolved ? "bg-green-500/20 text-green-500" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Resolved
                    </button>

                    <button
                        onClick={() => { setStatusFilter(ReportStatus.VideoRemoved); setPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${statusFilter === ReportStatus.VideoRemoved ? "bg-red-500/20 text-[#FF4444]" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Removed
                    </button>
                </div>
            </div>

            <div className="bg-[#212121] border border-[#3F3F3F] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>
                    ) : reports && reports.length > 0 ? (
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-[#3F3F3F] bg-[#181818]/80">
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider w-[25%]">Video</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider w-[35%]">Report Details</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Reporter</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Status</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider text-right pr-8">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#3F3F3F]">

                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-[#272727] transition-colors group">
                                    <td className="p-5 flex flex-col gap-2">
                                        <div className="w-32 h-20 bg-black rounded-md overflow-hidden shrink-0 border border-[#3F3F3F] relative">
                                            <img src={report.video.thumbnailUrl || "/placeholder.jpg"} alt="thumb" className="w-full h-full object-cover" />
                                        </div>

                                        <a href={`/watch/${report.video.id}`} target="_blank" className="text-[14px] text-white font-medium line-clamp-2 hover:text-[#3ea6ff] transition-colors flex items-center gap-1">
                                            {report.video.title}
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                        </a>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 w-fit capitalize">
                                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                                {/* ИСПОЛЬЗУЕМ СЛОВАРЬ ЗДЕСЬ */}
                                                {REPORT_REASONS_MAP[Number(report.reason)] || "Unknown Reason"}
                                            </span>

                                            {report.details && (
                                                <p className="text-[#AAAAAA] text-[13px] bg-[#181818] p-2.5 rounded-lg border border-[#3F3F3F] mt-1 line-clamp-3">
                                                    "{report.details}"
                                                </p>
                                            )}

                                            {report.moderatorNote && (
                                                <div className="mt-2 flex items-start gap-2 text-[13px] text-[#3ea6ff] bg-[#3ea6ff]/10 p-2.5 rounded-lg border border-[#3ea6ff]/20">
                                                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />

                                                    <div>
                                                        <span className="font-bold block mb-0.5">Moderator Note:</span>
                                                        {report.moderatorNote}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-medium text-white">@{report.reporter.username}</span>

                                            <span className="text-[#888888] text-[12px] mt-1">
                                                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                            report.status === ReportStatus.Pending ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                                                report.status === ReportStatus.Resolved ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                    "bg-red-500/10 text-[#FF4444] border border-red-500/20"
                                        }`}>
                                            {ReportStatus[report.status]}
                                        </span>

                                        {report.reviewedAt && (
                                            <div className="text-[11px] text-[#888888] mt-2">
                                                Reviewed: {format(new Date(report.reviewedAt), "MMM d, yyyy")}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-5 pr-8 text-right">
                                        {report.status === ReportStatus.Pending && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openNoteModal(report.id, ReportStatus.Resolved)}
                                                    className="p-2 hover:bg-green-500/20 text-green-500 rounded-full transition-colors cursor-pointer"
                                                    title="Keep Video & Resolve"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => openNoteModal(report.id, ReportStatus.VideoRemoved)}
                                                    className="p-2 hover:bg-red-500/20 text-[#FF4444] rounded-full transition-colors cursor-pointer"
                                                    title="Delete Video & Resolve"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 flex flex-col items-center justify-center text-[#AAAAAA]">
                            <Filter className="w-12 h-12 mb-4 opacity-50" />
                            <span className="text-lg font-medium">No reports found</span>
                            <span className="text-sm mt-1">Try changing the status filter above.</span>
                        </div>
                    )}
                </div>

                {reports && reports.length === 20 && (
                    <div className="p-4 border-t border-[#3F3F3F] flex justify-center gap-2 bg-[#181818]/80">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md disabled:opacity-50 text-sm cursor-pointer"
                        >
                            Previous
                        </button>

                        <span className="px-4 py-2 text-[#AAAAAA] text-sm flex items-center">Page {page}</span>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md text-sm cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {noteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#212121] rounded-xl w-full max-w-[500px] shadow-2xl border border-[#3F3F3F] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-[#3F3F3F]">
                            <h2 className="text-xl font-bold text-white">
                                {actionType === ReportStatus.Resolved ? "Resolve Report (Keep Video)" : "Remove Video"}
                            </h2>
                        </div>

                        <div className="p-6">
                            <p className="text-[#AAAAAA] text-sm mb-4">
                                Add an optional note to explain your decision. This note might be visible to other moderators.
                            </p>

                            <textarea
                                value={moderatorNote}
                                onChange={(e) => setModeratorNote(e.target.value)}
                                placeholder="E.g., 'Video reviewed, no policy violations found' or 'Video contains explicit content at 1:23'"
                                className="w-full bg-[#181818] border border-[#3F3F3F] rounded-lg p-3 text-white focus:outline-none focus:border-[#3ea6ff] h-32 resize-none transition-colors"
                            />
                        </div>

                        <div className="p-4 border-t border-[#3F3F3F] flex justify-end gap-3 bg-[#181818]">
                            <button
                                onClick={() => setNoteModalOpen(false)}
                                className="px-6 py-2 hover:bg-[#3F3F3F] text-white rounded-full font-medium transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={submitReviewWithNote}
                                disabled={isReviewing}
                                className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                                    actionType === ReportStatus.Resolved
                                        ? "bg-green-500 hover:bg-green-600 text-black"
                                        : "bg-[#FF4444] hover:bg-red-600 text-white"
                                }`}
                            >
                                {isReviewing && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}