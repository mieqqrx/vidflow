"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import Image from "next/image";
import { useLoginForm } from "@/hooks/useLoginForm";

export default function LoginPage() {
    const {
        form: { register, handleSubmit, formState: { errors } },
        onSubmit,
        isLoading,
        apiError,
        showPassword,
        togglePassword
    } = useLoginForm();

    return (
        <div className="fixed inset-0 z-50 bg-[#0F0F0F] flex items-center justify-center p-4">
            <div className="w-full sm:w-[450px] bg-[#0F0F0F] sm:border sm:border-[#1F1F1F] rounded-[28px] px-6 sm:px-10 py-10 flex flex-col items-center transition-all">
                <div className="flex flex-col items-center mb-10 w-full">
                    <div className="mb-4">
                        <Image src="/vidflow_logo.png" alt="VidFlow Logo" width={48} height={48} className="object-contain" />
                    </div>

                    <h1 className="text-[24px] text-white font-normal mb-2">Sign in</h1>

                    <p className="text-white text-[16px]">
                        to continue to <span className="font-medium">VidFlow</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">

                    <div>
                        <FloatingLabelInput
                            label="Email"
                            type="email"
                            {...register("email")}
                        />

                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="relative">
                        <FloatingLabelInput
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            {...register("password")}
                        />

                        <button
                            type="button"
                            onClick={togglePassword}
                            className="absolute right-3 top-3 text-[#AAAAAA] text-xs hover:text-white"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>

                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex justify-start !mt-1">
                        <Link href="#" className="text-[#3ea6ff] font-medium text-sm hover:bg-[#3ea6ff]/10 px-2 -ml-2 py-1.5 rounded-[4px] transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    {apiError && (
                        <div className="p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-sm">
                            Invalid email or password
                        </div>
                    )}

                    <div className="text-[#AAAAAA] text-sm leading-relaxed mb-12 mt-6">
                        Not your computer? Use Guest mode to sign in privately. <br />

                        <Link href="#" className="text-[#3ea6ff] font-medium hover:text-[#6ebcff] inline-block mt-1 no-underline hover:underline">
                            Learn more
                        </Link>
                    </div>

                    <div className="flex items-center justify-between pt-6">
                        <Link
                            href="/register"
                            className="text-[#3ea6ff] font-medium text-sm hover:bg-[#3ea6ff]/10 px-4 py-2 rounded-[4px] transition-colors"
                        >
                            Create account
                        </Link>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-[#0f0f0f] font-medium px-6 h-9 rounded-full text-sm transition-all shadow-none hover:shadow-sm disabled:opacity-50"
                        >
                            {isLoading ? "Signing in..." : "Next"}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-between max-w-[450px] mx-auto px-4 text-xs text-[#AAAAAA]">
                <div className="cursor-pointer hover:text-white bg-transparent">English (United States)</div>
                <div className="flex gap-6">
                    <span className="cursor-pointer hover:text-white">Help</span>
                    <span className="cursor-pointer hover:text-white">Privacy</span>
                    <span className="cursor-pointer hover:text-white">Terms</span>
                </div>
            </div>
        </div>
    );
}