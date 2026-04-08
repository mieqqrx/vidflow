import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse } from "@react-oauth/google";
import { useGoogleLoginMutation, useLoginMutation } from "@/store/api";
import { loginSchema, LoginFormValues } from "@/lib/validation/auth";
import { useAppDispatch } from "@/store/hooks";
import { setActiveUser } from "@/store/slices/authSlice";

const getUserIdFromToken = (token?: string) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch (e) {
        return null;
    }
};

export const useLoginForm = () => {
    const dispatch = useAppDispatch();
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
            const res = await googleLoginApi({ idToken: credentialResponse.credential }).unwrap() as any;

            console.log("Google Login Response:", res);

            const newUserId = getUserIdFromToken(res.token) || res.userId || res.user?.id;
            if (newUserId) {
                dispatch(setActiveUser(newUserId));
            }

            window.location.href = "/";
        } catch (err) {
            console.error("Google login failed:", err);
        }
    };

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const res = await loginApi(data).unwrap() as any;

            const newUserId = getUserIdFromToken(res.token) || res.userId || res.user?.id;
            if (newUserId) {
                dispatch(setActiveUser(newUserId));
            }

            window.location.href = "/";
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