import React from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
    ({ label, className, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    {...props}
                    ref={ref}
                    placeholder=" "
                    className={cn(
                        "block px-4 pb-2.5 pt-6 w-full text-base text-white bg-transparent rounded-lg border-[1px]",
                        "border-[#505050] appearance-none focus:outline-none focus:ring-0 focus:border-[#3ea6ff]",
                        "peer h-14 transition-colors",
                        "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s]",
                        className
                    )}
                />
                <label
                    className={cn(
                        "absolute text-[#AAAAAA] duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 bg-[#0F0F0F] px-1 pointer-events-none",
                        "peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0",
                        "peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-[#3ea6ff]"
                    )}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingLabelInput.displayName = "FloatingLabelInput";