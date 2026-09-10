// src/layouts/RootLayout.tsx
import { AuthProvider } from "@/context/AuthProvider";
import { Outlet } from "react-router-dom";

const RootLayout = () => {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
};

export default RootLayout;
