import { Outlet } from "react-router-dom";
import { AppNavbar } from "@/components/navigation/AppNavbar";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppNavbar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
