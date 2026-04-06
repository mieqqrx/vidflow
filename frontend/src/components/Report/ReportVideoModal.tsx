"use client";

import React, { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCreateVideoReportMutation } from "@/store/api";

interface ReportVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
}

const REPORT_REASONS = [
    { label: "Sexual content", value: 0 },
    { label: "Violent or repulsive content", value: 1 },
    { label: "Hateful or abusive content", value: 2 },
    { label: "Harmful or dangerous acts", value: 3 },
    { label: "Spam or misleading", value: 4 },
    { label: "Scams or fraud", value: 5 }
];

export default function ReportVideoModal({ isOpen, onClose, videoId }: ReportVideoModalProps) {
    const [selectedReason, setSelectedReason] = useState<number | null>(null);
    const [details, setDetails] = useState("");
    const [step, setStep] = useState<1 | 2>(1);

    const [createReport, { isLoading }] = useCreateVideoReportMutation();

    if (!isOpen) return null;

    const handleClose = () => {
        setStep(1);
        setSelectedReason(null);
        setDetails("");
        onClose();
    };

    const handleSubmit = async () => {
        if (selectedReason === null) return;

        try {
            const payload = {
                videoId,
                reason: selectedReason,
                details: details.trim() !== "" ? details.trim() : undefined
            };

            await createReport(payload).unwrap();
            toast.success("Report submitted successfully");
            handleClose();
        } catch (error: any) {
            console.error("Full error:", error);
            if (error?.status === 401) {
                toast.error("Please sign in to report this video");
            } else {
                toast.error(error?.data?.message || "Failed to submit report");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#212121] rounded-xl w-full max-w-[500px] shadow-2xl border border-[#3F3F3F] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[#3F3F3F]">
                    <h2 className="text-xl font-bold text-white">Report video</h2>

                    <button onClick={handleClose} className="p-2 hover:bg-[#3F3F3F] rounded-full transition-colors text-white cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <>
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-[#FF0000]" />
                                What is the issue?
                            </h3>

                            <div className="space-y-3">
                                {REPORT_REASONS.map((item) => (
                                    <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center w-5 h-5 border-2 border-[#AAAAAA] group-hover:border-white rounded-full transition-colors">
                                            {selectedReason === item.value && (
                                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                            )}
                                        </div>

                                        <input
                                            type="radio"
                                            name="report_reason"
                                            value={item.value}
                                            checked={selectedReason === item.value}
                                            onChange={() => setSelectedReason(item.value)}
                                            className="hidden"
                                        />

                                        <span className={`text-[15px] transition-colors ${selectedReason === item.value ? "text-white" : "text-[#AAAAAA] group-hover:text-white"}`}>
                                            {item.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-white font-medium mb-2">Provide additional details</h3>

                            <p className="text-[#AAAAAA] text-sm mb-4">
                                This helps us understand the issue better. Do not include sensitive personal information.
                            </p>

                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Provide more details (optional)"
                                className="w-full bg-[#181818] border border-[#3F3F3F] rounded-lg p-3 text-white focus:outline-none focus:border-[#3ea6ff] h-32 resize-none transition-colors"
                            />
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-[#3F3F3F] flex justify-end gap-3 bg-[#181818]">
                    <Button variant="ghost" onClick={handleClose} className="hover:bg-[#3F3F3F] text-white rounded-full cursor-pointer">
                        Cancel
                    </Button>

                    {step === 1 ? (
                        <Button
                            onClick={() => setStep(2)}
                            disabled={selectedReason === null}
                            className="bg-white hover:bg-gray-200 text-black font-medium rounded-full px-6 cursor-pointer"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium rounded-full px-6 cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Report"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}