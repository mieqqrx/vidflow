import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const FlagIcon = ({ className, filled, ...props }: IconProps) => {
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
            <g clipPath="url(#clip0_153_738)">
                <path
                    d="M13.18 4L13.42 5.2L13.58 6H14.4H19V13H13.82L13.58 11.8L13.42 11H12.6H6V4H13.18ZM14 3H5V21H6V12H12.6L13 14H20V5H14.4L14 3Z"
                    fill="#EEEEEE"
                    stroke="#EEEEEE"
                    strokeWidth={filled ? "0" : "1"}
                />
            </g>
            <defs>
                <clipPath id="clip0_153_738">
                    <rect width="24" height="24" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
};