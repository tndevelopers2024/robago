// src/routes/PermissionRoute.tsx
import { Outlet } from "react-router-dom";
import type { Permission } from "@robago/shared";
import AccessDenied from "@/components/shared/AccessDenied";
import { useAuth } from "@/context/AuthProvider";

/** Lets the person through only if their role holds `permission`; otherwise shows a clear "no access" page.
 *  This is a courtesy for the screen — the server enforces the same rule on every request, so skipping this
 *  would not expose any data. Must sit under ProtectedRoute so `user` exists. */
export default function PermissionRoute({ permission }: { permission: Permission }) {
    const { can } = useAuth();
    return can(permission) ? <Outlet /> : <AccessDenied />;
}
