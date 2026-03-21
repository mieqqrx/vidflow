import { createSlice } from "@reduxjs/toolkit";

interface SidebarState {
    isOpen: boolean;
    isDrawerOpen: boolean;
}

const initialState: SidebarState = {
    isOpen: true,
    isDrawerOpen: false,
};

const sidebarSlice = createSlice({
    name: "sidebar",
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isOpen = !state.isOpen;
        },
        toggleDrawer: (state) => {
            state.isDrawerOpen = !state.isDrawerOpen;
        },
        closeDrawer: (state) => {
            state.isDrawerOpen = false;
        },
    },
});

export const { toggleSidebar, toggleDrawer, closeDrawer } = sidebarSlice.actions;
export default sidebarSlice.reducer;