// src/layouts/AppLayout.tsx
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/app-header";
import BottomNav from "@/components/layout/BottomNav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-screen overflow-hidden bg-[#F8FAFC]">
                <AppHeader />
                <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
                    <Outlet />
                </main>
                <BottomNav />
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppLayout;
