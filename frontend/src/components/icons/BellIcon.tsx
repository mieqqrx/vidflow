import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const BellIcon = ({ className, filled, ...props }: IconProps) => {
    return (
        <svg
            width="16"
            height="21"
            viewBox="0 0 16 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <path
                d="M6 18.04H10C10 19.14 9.1 20.04 8 20.04C6.9 20.04 6 19.14 6 18.04ZM16 15.39V17.04H0V15.39L2 13.51V8.35995C2 5.43995 3.56 3.13995 6 2.37995V1.99995C6 0.579954 7.49 -0.500046 8.99 0.239954C9.64 0.559954 10 1.26995 10 1.99995V2.38995C12.44 3.13995 14 5.44995 14 8.36995V13.52L16 15.39ZM15 15.81L13 13.93V8.45995C13 5.98995 11.81 4.09995 9.87 3.35995C8.61 2.82995 7.23 2.85995 6.03 3.38995C4.15 4.14995 3 6.02995 3 8.45995V13.93L1 15.81V16.04H15V15.81Z"
                fill="white"
                stroke="currentColor"
                strokeWidth={filled ? "0" : "0.5"}
            />
        </svg>
    );
};