import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    activeUserId: string | null;
}

const initialState: AuthState = {
    activeUserId: typeof window !== "undefined" ? localStorage.getItem("vidflow_active_user") : null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setActiveUser: (state, action: PayloadAction<string>) => {
            state.activeUserId = action.payload;
            if (typeof window !== "undefined") {
                localStorage.setItem("vidflow_active_user", action.payload);
            }
        },
        clearActiveUser: (state) => {
            state.activeUserId = null;
            if (typeof window !== "undefined") {
                localStorage.removeItem("vidflow_active_user");
            }
        }
    }
});

export const { setActiveUser, clearActiveUser } = authSlice.actions;
export default authSlice.reducer;