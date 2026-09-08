import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthProvider";
import { Toaster } from "sonner";

export function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50/50 text-slate-900 antialiased font-sans">
        <Outlet />
        <Toaster richColors position="top-right" closeButton />
      </div>
    </AuthProvider>
  );
}
