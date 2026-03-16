"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { useLoginForm } from "@/hooks/useLoginForm";

export default function LoginPage() {
    const {
        form: { register, handleSubmit, formState: { errors } },
        onSubmit,
        handleGoogleSuccess,
        isLoading,
        apiError,
        showPassword,
        togglePassword
    } = useLoginForm();

    return (
        <div className="fixed inset-0 z-50 bg-[#0F0F0F] flex items-center justify-center p-4">
            <div className="w-full sm:w-[450px] bg-[#0F0F0F] sm:border sm:border-[#1F1F1F] rounded-[28px] px-6 sm:px-10 py-10 flex flex-col items-center transition-all shadow-2xl">
                <div className="flex flex-col items-center mb-8 w-full">
                    <div className="mb-4">
                        <Image src="/vidflow_logo.png" alt="VidFlow Logo" width={48} height={48} className="object-contain" />
                    </div>
                    <h1 className="text-[24px] text-white font-normal mb-2">Sign in</h1>
                    <p className="text-white text-[16px]">
                        to continue to <span className="font-medium">VidFlow</span>
                    </p>
                </div>

                <div className="w-full space-y-4">
                    <div className="flex flex-col items-center w-full">
                        <div className="w-full flex justify-center overflow-hidden rounded-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.error("Google Login Failed")}
                                theme="filled_black"
                                shape="pill"
                                width="370"
                                text="signin_with"
                            />
                        </div>

                        <div className="relative w-full flex items-center py-6">
                            <div className="flex-grow border-t border-[#1F1F1F]"></div>
                            <span className="flex-shrink mx-4 text-[#AAAAAA] text-xs uppercase tracking-widest">or</span>
                            <div className="flex-grow border-t border-[#1F1F1F]"></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <FloatingLabelInput
                                label="Email"
                                type="email"
                                disabled={isLoading}
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
                                disabled={isLoading}
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={togglePassword}
                                className="absolute right-3 top-3 text-[#AAAAAA] text-xs hover:text-white transition-colors"
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
                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
                                Invalid email or password
                            </div>
                        )}

                        <div className="text-[#AAAAAA] text-sm leading-relaxed mb-8 mt-4">
                            Not your computer? Use Guest mode to sign in privately. <br />
                            <Link href="#" className="text-[#3ea6ff] font-medium hover:text-[#6ebcff] inline-block mt-1 no-underline hover:underline">
                                Learn more
                            </Link>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Link
                                href="/register"
                                className="text-[#3ea6ff] font-medium text-sm hover:bg-[#3ea6ff]/10 px-4 py-2 rounded-[4px] transition-colors"
                            >
                                Create account
                            </Link>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-[#0f0f0f] font-semibold px-8 h-10 rounded-full text-sm transition-all shadow-none disabled:opacity-50 disabled:bg-[#3ea6ff]/50"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[#0f0f0f]/30 border-t-[#0f0f0f] rounded-full animate-spin"></div>
                                        Processing...
                                    </div>
                                ) : "Next"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-between max-w-[450px] mx-auto px-4 text-xs text-[#AAAAAA]">
                <div className="cursor-pointer hover:text-white transition-colors">English (United States)</div>
                <div className="flex gap-6">
                    <span className="cursor-pointer hover:text-white transition-colors">Help</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
                </div>
            </div>
        </div>
    );
}