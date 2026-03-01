"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { useRegisterForm } from "@/hooks/useRegisterForm";

export default function RegisterPage() {
    const {
        form: { register, handleSubmit, formState: { errors } },
        onSubmit,
        isLoading,
        apiError,
        showPassword,
        togglePassword
    } = useRegisterForm();

    return (
        <div className="fixed inset-0 z-50 bg-[#0F0F0F] flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full sm:w-[500px] md:w-[850px] bg-[#0F0F0F] sm:border sm:border-[#1F1F1F] rounded-[28px] p-6 sm:p-10 md:p-12 flex flex-col md:flex-row gap-4 md:gap-12 transition-all my-auto">
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-6">
                        <Image src="/vidflow_logo.png" alt="VidFlow Logo" width={48} height={48} className="object-contain" />
                    </div>

                    <h1 className="text-[24px] text-white font-normal mb-8">Create your VidFlow Account</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
                        <div>
                            <FloatingLabelInput
                                label="Username"
                                type="text"
                                {...register("username")}
                            />

                            {errors.username && (
                                <p className="text-red-500 text-xs mt-1 ml-1">{errors.username.message}</p>
                            )}
                        </div>

                        <div>
                            <FloatingLabelInput
                                label="Date of Birth"
                                type="date"
                                className="appearance-none [&::-webkit-calendar-picker-indicator]:invert"
                                {...register("dateOfBirth")}
                            />

                            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1 ml-1">Date of birth is required</p>}
                        </div>

                        <div>
                            <FloatingLabelInput
                                label="Your email address"
                                type="email"
                                {...register("email")}
                            />

                            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div>
                                <FloatingLabelInput
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                />

                                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                            </div>

                            <div>
                                <FloatingLabelInput
                                    label="Confirm"
                                    type={showPassword ? "text" : "password"}
                                    {...register("confirmPassword")}
                                />

                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="text-[#AAAAAA] text-xs ml-1 mb-2 leading-tight">
                            Use 8 or more characters with a mix of letters, numbers & symbols
                        </div>

                        <div className="flex items-center space-x-2 mt-2 ml-1">
                            <input
                                type="checkbox"
                                id="showPass"
                                className="w-4 h-4 rounded border-[#505050] bg-transparent accent-[#3ea6ff] cursor-pointer"
                                checked={showPassword}
                                onChange={togglePassword}
                            />

                            <label htmlFor="showPass" className="text-sm text-white font-medium cursor-pointer select-none">
                                Show password
                            </label>
                        </div>

                        {apiError && (
                            <div className="p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-sm">
                                Registration failed. Please try again.
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-10 pt-4">
                            <Link href="/login" className="text-[#3ea6ff] font-medium text-sm hover:bg-[#3ea6ff]/10 px-4 py-2 rounded-[4px] transition-colors">
                                Sign in instead
                            </Link>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-[#0f0f0f] font-medium px-6 h-9 rounded-full text-sm transition-all shadow-none hover:shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? "Creating..." : "Next"}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="hidden md:flex w-[300px] flex-col items-center justify-center text-center space-y-6">
                    <img src="https://ssl.gstatic.com/accounts/signup/glif/account.svg" alt="Shield" className="w-60 h-60 opacity-90" />

                    <p className="text-white text-[15px] font-light max-w-[200px] leading-relaxed">
                        One account. All of VidFlow working for you.
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-between max-w-[850px] mx-auto px-6 text-xs text-[#AAAAAA]">
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