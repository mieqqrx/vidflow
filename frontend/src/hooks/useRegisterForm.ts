import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/store/api";
import { registerSchema, RegisterFormValues } from "@/lib/validation/auth";

export const useRegisterForm = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const [registerApi, { isLoading, error: apiError }] = useRegisterMutation();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            username: "",
            email: "",
            dateOfBirth: "",
            password: "",
            confirmPassword: ""
        }
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const dateISO = new Date(data.dateOfBirth).toISOString();

            await registerApi({
                username: data.username,
                email: data.email,
                password: data.password,
                dateOfBirth: dateISO,
            }).unwrap();

            router.push("/login");
        } catch (err: any) {
            console.error("Registration failed", err);

            // Вывод ошибки для отладки
            let errorMessage = "Unknown error";
            if (err.data && err.data.errors) {
                errorMessage = Object.values(err.data.errors).flat().join('\n');
            } else if (err.data) {
                errorMessage = JSON.stringify(err.data);
            }
            alert(`Ошибка от сервера:\n${errorMessage}`);
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