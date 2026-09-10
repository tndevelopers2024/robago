// src/routes/ProtectedRoutes.tsx
import { useAuth } from "@/context/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const { isAuthenticated, isBootstrapping } = useAuth();

    // Wait for the initial silent-refresh attempt (AuthProvider's useEffect) before
    // deciding — otherwise a hard page refresh always bounces to /auth/login for a
    // split second even when the httpOnly refresh cookie is valid.
    if (isBootstrapping) return null;

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
