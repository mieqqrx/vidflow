"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, FileVideo, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCategoriesQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import axios from "axios";

interface UploadVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadVideoModal({ isOpen, onClose }: UploadVideoModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const activeUserId = useAppSelector((state) => state.auth.activeUserId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: categories = [] } = useGetCategoriesQuery();

    if (!isOpen) return null;

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("video/")) {
            toast.error("Please select a valid video file.");
            return;
        }
        setSelectedFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setStep(2);
    };

    const checkProcessingStatus = async (videoId: string) => {
        try {
            await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos/${videoId}`, {
                withCredentials: true,
                headers: { "X-Active-User": activeUserId || "" }
            });

            setIsProcessing(false);
            setIsFinished(true);
            toast.success("Video processed and published successfully!");

            setTimeout(() => {
                handleCloseModal();
            }, 3000);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setTimeout(() => checkProcessingStatus(videoId), 3000);
            } else {
                setIsProcessing(false);
                toast.error("An error occurred during processing.");
                setStep(2);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("File", selectedFile);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("categoryId", categoryId);

        try {
            setStep(3);
            setUploadProgress(0);
            setIsProcessing(false);
            setIsFinished(false);

            const uploadRes = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/videos/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: { "X-Active-User": activeUserId || "" },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percent);
                        }
                    },
                }
            );

            setIsProcessing(true);
            setUploadProgress(100);

            const videoId = uploadRes.data.videoId;

            if (videoId) {
                checkProcessingStatus(videoId);
            } else {
                throw new Error("No videoId returned from server");
            }

        } catch (error: any) {
            console.error("Failed to upload video:", error);
            setStep(2);
            const errorMessage = error.response?.data?.message || "Failed to upload video. Please try again.";
            toast.error(errorMessage);
        }
    };

    const handleCloseModal = () => {
        setStep(1);
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setCategoryId("");
        setUploadProgress(0);
        setIsProcessing(false);
        setIsFinished(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
            <div
                className="bg-[#282828] w-full max-w-[900px] h-[600px] rounded-xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#3F3F3F]">
                    <h2 className="text-xl font-medium text-white">
                        {step === 1 ? "Upload video" : step === 2 ? "Details" : "Uploading..."}
                    </h2>

                    <button
                        onClick={handleCloseModal}
                        disabled={uploadProgress > 0 && !isFinished}
                        className="text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {step === 1 && (
                    <div
                        className={`flex-1 flex flex-col items-center justify-center p-10 transition-colors ${
                            isDragging ? "bg-[#3F3F3F]/50" : ""
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    >
                        <div className="w-32 h-32 rounded-full bg-[#1F1F1F] flex items-center justify-center mb-6">
                            <Upload className={`w-12 h-12 text-[#AAAAAA] ${isDragging ? "animate-bounce text-[#3ea6ff]" : ""}`} />
                        </div>

                        <h3 className="text-[20px] text-white mb-2 font-medium">Drag and drop video files to upload</h3>
                        <p className="text-[#AAAAAA] text-[13px] mb-8">Your videos will be private until you publish them.</p>

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#3ea6ff] hover:bg-[#6ebcff] cursor-pointer text-black font-medium px-6 py-5 rounded-sm text-sm"
                        >
                            SELECT FILES
                        </Button>

                        <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files![0])} accept="video/*" className="hidden" />
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[#AAAAAA] mb-2">Title (required)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Add a title"
                                    className="w-full bg-transparent border border-[#AAAAAA] rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#AAAAAA] mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell viewers about your video"
                                    rows={5}
                                    className="w-full bg-transparent border border-[#AAAAAA] rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#AAAAAA] mb-2">Category</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-[#1F1F1F] border border-[#AAAAAA] rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#3ea6ff]"
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="w-[300px] bg-[#1F1F1F] p-6 border-l border-[#3F3F3F] flex flex-col items-center justify-center text-center">
                            <div className="aspect-video w-full bg-[#0F0F0F] rounded-md flex items-center justify-center mb-4">
                                <FileVideo className="w-12 h-12 text-[#AAAAAA]" />
                            </div>

                            <div className="text-sm w-full">
                                <span className="text-[#AAAAAA]">Filename</span>
                                <p className="text-white truncate mt-1">{selectedFile?.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10">
                        {isFinished ? (
                            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
                                <h3 className="text-2xl text-white font-medium mb-2">Upload Complete!</h3>
                                <p className="text-[#AAAAAA]">Your video is now live on the platform.</p>
                            </div>
                        ) : isProcessing ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-20 h-20 text-[#3ea6ff] animate-spin mb-6" />
                                <h3 className="text-xl text-white font-medium mb-2">Processing Video...</h3>
                                <p className="text-[#AAAAAA] text-center max-w-sm">
                                    Generating HD formats. This might take a minute depending on video length.
                                    <br/>Please do not close this window.
                                </p>
                            </div>
                        ) : (
                            <div className="w-full max-w-md flex flex-col items-center">
                                <FileVideo className="w-16 h-16 text-[#AAAAAA] mb-4" />
                                <h3 className="text-2xl text-white font-medium mb-6">Uploading: {uploadProgress}%</h3>

                                <div className="w-full h-3 bg-[#1F1F1F] rounded-full overflow-hidden mb-4 border border-[#3F3F3F]">
                                    <div
                                        className="h-full bg-[#3ea6ff] transition-all duration-300 relative"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <p className="text-[#AAAAAA] text-sm">Transferring file to secure servers...</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="px-6 py-4 flex justify-end border-t border-[#3F3F3F]">
                        <Button
                            onClick={handleUpload}
                            disabled={!title.trim() || !categoryId}
                            className="bg-[#3ea6ff] cursor-pointer hover:bg-[#6ebcff] text-black font-medium px-6 rounded-sm min-w-[100px]"
                        >
                            UPLOAD
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}