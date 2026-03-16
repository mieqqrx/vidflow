import { apiSlice } from "./apiSlice";
import { AuthResponse, LoginRequest, RegisterRequest, User, UpdateUserSettingsDto } from "@/types";

// Добавляем интерфейс для сессий
export interface SessionUser {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
}

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            // Инвалидируем Sessions, чтобы список аккаунтов обновился
            invalidatesTags: ["User", "Channel", "Sessions"],
        }),

        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            async onQueryStarted(args, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(apiSlice.util.resetApiState()); // Очищаем весь кэш
                } catch (err) {
                    console.error("Error to logout", err);
                }
            },
        }),

        // НОВЫЙ ЭНДПОИНТ: Выход из всех аккаунтов
        logoutAll: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout-all",
                method: "POST",
            }),
            async onQueryStarted(args, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(apiSlice.util.resetApiState()); // Очищаем весь кэш
                } catch (err) {
                    console.error("Error to logout all", err);
                }
            },
        }),

        register: builder.mutation<void, RegisterRequest>({
            query: (userData) => ({
                url: "/auth/register",
                method: "POST",
                body: userData,
            }),
        }),

        googleLogin: builder.mutation<{ message: string }, { idToken: string }>({
            query: (body) => ({
                url: 'auth/google',
                method: 'POST',
                body,
            }),
            invalidatesTags: ["User", "Sessions"],
        }),

        getMe: builder.query<User, void>({
            query: () => "/auth/me",
            providesTags: ["User", "Channel"],
        }),

        // НОВЫЙ ЭНДПОИНТ: Получение всех активных сессий
        getSessions: builder.query<SessionUser[], void>({
            query: () => "/auth/sessions",
            providesTags: ["Sessions"],
        }),

        updateAvatar: builder.mutation<{ message: string; avatarUrl: string }, FormData>({
            query: (formData) => ({
                url: `/auth/avatar`,
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: ["User", "Channel", "Sessions"],
        }),

        updateUserSettings: builder.mutation<void, UpdateUserSettingsDto>({
            query: (settings) => ({
                url: `/auth/settings`,
                method: "PUT",
                body: settings,
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useLogoutAllMutation,
    useRegisterMutation,
    useGoogleLoginMutation,
    useGetMeQuery,
    useGetSessionsQuery,
    useUpdateAvatarMutation,
    useUpdateUserSettingsMutation,
} = authApi;