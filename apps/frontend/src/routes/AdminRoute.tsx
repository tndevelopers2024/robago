// src/routes/AdminRoute.tsx
import { useAuth } from "@/context/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import { UserRole } from "@robago/shared";

/** No regraft equivalent — regraft has no role concept. This is client-side UX only;
 *  the real enforcement is the backend's requireRole middleware (robago-prd.md §0/§4 —
 *  the legacy app had a `role` field that gated nothing, server or client). Must be
 *  nested under ProtectedRoute so `user` is guaranteed non-null here. */
const AdminRoute = () => {
    const { user } = useAuth();
    return user?.role === UserRole.Admin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
