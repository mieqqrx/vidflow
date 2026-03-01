"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, FileVideo, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCategoriesQuery, useUploadVideoMutation } from "@/store/api/apiSlice";

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

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadVideo, { isLoading: isUploading }] = useUploadVideoMutation();
    const { data: categories = [] } = useGetCategoriesQuery();

    if (!isOpen) return null;

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("video/")) {
            alert("Please select a video file");
            return;
        }
        setSelectedFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setStep(2);
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
            await uploadVideo(formData).unwrap();

            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (error) {
            console.error("Failed to upload video:", error);
            setStep(2);
        }
    };

    const handleCloseModal = () => {
        setStep(1);
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setCategoryId("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
            <div
                className="bg-[#282828] w-full max-w-[900px] h-[600px] rounded-xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {isUploading && (
                    <div className="absolute top-[60px] left-0 w-full h-1 bg-[#3F3F3F] overflow-hidden z-10">
                        <div className="h-full bg-[#3ea6ff] animate-progress-indeterminate"></div>
                    </div>
                )}

                <div className="flex items-center justify-between px-6 py-4 border-b border-[#3F3F3F]">
                    <h2 className="text-xl font-medium text-white">
                        {step === 1 ? "Upload video" : step === 2 ? "Details" : "Uploading..."}
                    </h2>

                    <button
                        onClick={handleCloseModal}
                        disabled={isUploading}
                        className="text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-50"
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
                            className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium px-6 py-5 rounded-sm text-sm"
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
                    <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
                        {isUploading ? (
                            <>
                                <div className="relative w-24 h-24 mb-6">
                                    <Loader2 className="w-24 h-24 text-[#3ea6ff] animate-spin absolute inset-0" />
                                    <FileVideo className="w-10 h-10 text-white absolute inset-0 m-auto" />
                                </div>
                                <h3 className="text-xl text-white font-medium mb-2">Uploading your video...</h3>
                                <p className="text-[#AAAAAA]">Please keep this window open until upload is complete.</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-in zoom-in duration-300" />
                                <h3 className="text-xl text-white font-medium mb-2">Upload Complete!</h3>
                                <p className="text-[#AAAAAA]">Your video is now being processed.</p>
                            </>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="px-6 py-4 flex justify-end border-t border-[#3F3F3F]">
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading || !title.trim() || !categoryId}
                            className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium px-6 rounded-sm min-w-[100px]"
                        >
                            UPLOAD
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}