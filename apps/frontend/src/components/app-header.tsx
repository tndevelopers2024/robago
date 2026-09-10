// src/components/app-header.tsx
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthProvider";

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
}

const ROUTE_HEADINGS: Record<string, { title: string; subtitle: string }> = {
    "/": { title: "", subtitle: "" }, // DashboardPage renders its own greeting
    "/inventory": { title: "Inventory", subtitle: "Raw materials and finished products on hand" },
    "/inventory/alerts": { title: "Low Stock Alerts", subtitle: "Items below their alert threshold" },
    "/manage/categories": { title: "Categories", subtitle: "Product categories and their tag colors" },
    "/manage/products": { title: "Products", subtitle: "Catalog items across all categories" },
    "/manage/warehouses": { title: "Warehouses", subtitle: "Storage locations" },
    "/manage/suppliers": { title: "Suppliers", subtitle: "Raw material suppliers" },
    "/manage/production-units": { title: "Production Units", subtitle: "Internal and job-work lines" },
    "/manage/users": { title: "Users", subtitle: "Staff accounts and roles" },
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
    const location = useLocation();
    const routeHeading = ROUTE_HEADINGS[location.pathname];
    const displayTitle = title ?? routeHeading?.title;
    const displaySubtitle = subtitle ?? routeHeading?.subtitle;
    const { user } = useAuth();

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : "?";

    return (
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-8 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="text-slate-600 md:hidden" />
                {displayTitle && (
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            {displayTitle}
                        </h1>
                        {displaySubtitle && (
                            <p className="text-xs text-slate-500">{displaySubtitle}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <Avatar className="size-10 border border-slate-200 shadow-xs">
                    <AvatarFallback className="bg-slate-900 text-sm font-semibold text-white">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

export default AppHeader;
