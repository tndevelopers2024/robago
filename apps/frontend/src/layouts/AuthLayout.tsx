// src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
    return (
        <main className="mx-auto min-h-screen w-full flex-1">
            <Outlet />
        </main>
    );
};

export default AuthLayout;
