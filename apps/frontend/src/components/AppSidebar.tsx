// src/components/AppSidebar.tsx
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";
import menuItems from "@/static/menuConfig";
import { LogOut } from "lucide-react";
import { useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

function isItemActive(itemUrl: string, pathname: string): boolean {
    if (itemUrl === "/inventory/alerts") {
        return pathname.startsWith("/inventory/alerts");
    }
    if (itemUrl === "/inventory") {
        return (
            pathname === "/inventory" ||
            (pathname.startsWith("/inventory/") && !pathname.startsWith("/inventory/alerts"))
        );
    }
    if (itemUrl === "/") {
        return pathname === "/";
    }
    return pathname === itemUrl || pathname.startsWith(itemUrl + "/");
}

const AppSidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const handleLogout = useCallback(() => {
        void logout();
    }, [logout]);

    return (
        <Sidebar className="border-r-0 text-white **:data-[slot=sidebar-inner]:bg-linear-to-b **:data-[slot=sidebar-inner]:from-[#1565C0] **:data-[slot=sidebar-inner]:to-[#0D47A1]">
            <SidebarHeader className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-xs">
                        <img
                            src="/images/robago-logo.png"
                            alt="Robago Logo"
                            className="size-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold tracking-tight text-white leading-tight">
                            Robago
                        </span>
                        <span className="text-xs font-medium text-white/70">
                            Enterprise ERP
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-6">
                <SidebarGroup className="p-0">
                    <nav>
                        <SidebarMenu className="space-y-2">
                            {menuItems.map((item) => {
                                const active = isItemActive(item.url, location.pathname);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <NavLink
                                            to={item.url}
                                            className={cn(
                                                "flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "bg-white font-semibold text-[#1565C0] shadow-md shadow-black/5"
                                                    : "text-white/80 hover:bg-white/10 hover:text-white",
                                            )}
                                        >
                                            <item.icon className="size-5 shrink-0" />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </nav>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 pt-2">
                {user && (
                    <div className="mb-2 px-4 text-xs text-white/60">
                        {user.name} · {user.role}
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
                >
                    <LogOut className="size-4 shrink-0" />
                    <span>Logout</span>
                </button>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
