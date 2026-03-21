import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/store/api/apiSlice";
import authReducer from "@/store/slices/authSlice";
import sidebarReducer from "@/store/slices/sidebarSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            [apiSlice.reducerPath]: apiSlice.reducer,
            auth: authReducer,
            sidebar: sidebarReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(apiSlice.middleware),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];