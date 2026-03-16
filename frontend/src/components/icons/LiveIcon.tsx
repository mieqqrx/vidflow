import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const LiveIcon = ({ className, filled, ...props }: IconProps) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <g clipPath="url(#clip0_153_685)">
                <path
                    d="M14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 9.99998 12 9.99998C13.1 9.99998 14 10.9 14 12ZM8.48 8.44998L7.77 7.74998C6.68 8.82998 6 10.34 6 12C6 13.66 6.68 15.17 7.77 16.25L8.48 15.54C7.57 14.64 7 13.39 7 12C7 10.61 7.57 9.35998 8.48 8.44998ZM16.23 7.74998L15.52 8.45998C16.43 9.35998 17 10.61 17 12C17 13.39 16.43 14.64 15.52 15.55L16.23 16.26C17.32 15.17 18 13.66 18 12C18 10.34 17.32 8.82998 16.23 7.74998ZM5.65 5.62998L4.95 4.91998C3.13 6.72998 2 9.23998 2 12C2 14.76 3.13 17.27 4.95 19.08L5.66 18.37C4.02 16.74 3 14.49 3 12C3 9.50998 4.02 7.25998 5.65 5.62998ZM19.05 4.91998L18.34 5.62998C19.98 7.25998 21 9.50998 21 12C21 14.49 19.98 16.74 18.35 18.37L19.06 19.08C20.87 17.27 22 14.76 22 12C22 9.23998 20.87 6.72998 19.05 4.91998Z"
                    fill="#EEEEEE"
                    stroke="#EEEEEE"
                    strokeWidth={filled ? "0" : "1"}
                />
            </g>
            <defs>
                <clipPath id="clip0_153_685">
                    <rect width="24" height="24" fill="white"/>
                </clipPath>
            </defs>
        </svg>

    );
};