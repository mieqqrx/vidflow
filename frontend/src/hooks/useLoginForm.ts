import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CredentialResponse } from "@react-oauth/google";
import { useGoogleLoginMutation, useLoginMutation } from "@/store/api";
import { loginSchema, LoginFormValues } from "@/lib/validation/auth";

export const useLoginForm = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const [loginApi, { isLoading, error: apiError }] = useLoginMutation();
    const [googleLoginApi, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            console.error("Google credential is missing");
            return;
        }

        try {
            await googleLoginApi({ idToken: credentialResponse.credential }).unwrap();
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Google login failed:", err);
        }
    };

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await loginApi(data).unwrap();
            router.push("/");
            router.refresh();
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return {
        form,
        onSubmit,
        handleGoogleSuccess,
        isLoading: isLoading || isGoogleLoading,
        apiError,
        showPassword,
        togglePassword: () => setShowPassword((prev) => !prev),
    };
};