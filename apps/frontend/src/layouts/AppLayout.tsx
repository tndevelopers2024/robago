// src/layouts/AppLayout.tsx
import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/app-header";
import BottomNav from "@/components/layout/BottomNav";
import DemoBanner from "@/components/layout/DemoBanner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
    // Wide desktops start with the full sidebar; tablets start with the slim icon rail.
    const [defaultOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1280);

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className="h-dvh min-w-0 overflow-hidden bg-[radial-gradient(60rem_30rem_at_100%_-10%,oklch(0.9_0.06_225/0.5),transparent),var(--background)]">
                <DemoBanner />
                <AppHeader />
                <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
                    <Outlet />
                </main>
                <BottomNav />
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppLayout;
