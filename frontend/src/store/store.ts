import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/store/api/apiSlice";
import authReducer from "@/store/authSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            [apiSlice.reducerPath]: apiSlice.reducer,
            auth: authReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(apiSlice.middleware),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];