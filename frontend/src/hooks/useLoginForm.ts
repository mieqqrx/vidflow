import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/store/api/apiSlice";
import { loginSchema, LoginFormValues } from "@/lib/validation/auth";

export const useLoginForm = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const [loginApi, { isLoading, error: apiError }] = useLoginMutation();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await loginApi(data).unwrap();

            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Login failed", err);
        }
    };

    return {
        form,
        onSubmit,
        isLoading,
        apiError,
        showPassword,
        togglePassword: () => setShowPassword((prev) => !prev),
    };
};