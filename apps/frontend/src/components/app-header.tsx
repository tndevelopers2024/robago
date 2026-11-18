// src/components/app-header.tsx
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthProvider";

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
}

const ROUTE_HEADINGS: Record<string, { title: string; subtitle: string }> = {
    "/": { title: "Dashboard", subtitle: "Today at a glance" },
    "/staff/salary": { title: "Salary sheet", subtitle: "Pay, advances and leave deductions" },
    "/staff/attendance": { title: "Attendance", subtitle: "Click a day to mark it" },
    "/staff/people": { title: "People", subtitle: "Everyone's profile and pay at a glance" },
    "/expenses/overview": { title: "Expenses", subtitle: "Where your money went this month" },
    "/expenses/entries": { title: "Expense entries", subtitle: "Every expense, editable like a sheet" },
    "/expenses/monthly": { title: "Month by month", subtitle: "Each item across the year" },
    "/expenses/items": { title: "Expense items", subtitle: "The things you spend on" },
    "/accounts/overview": { title: "Accounts", subtitle: "What you owe and what you're owed" },
    "/accounts/creditors": { title: "Creditors", subtitle: "People and businesses you have to pay" },
    "/accounts/debtors": { title: "Debtors", subtitle: "Money you have to collect" },
    "/accounts/activity": { title: "Activity log", subtitle: "Who did what, and when" },
    "/crm/schools": { title: "School visits", subtitle: "Log meetings, follow up, and find the next school to approach" },
    "/inventory": { title: "Inventory", subtitle: "Raw materials and finished products on hand" },
    "/inventory/alerts": { title: "Low Stock Alerts", subtitle: "Items below their alert threshold" },
    "/manage/categories": { title: "Categories", subtitle: "Product categories and their tag colors" },
    "/manage/products": { title: "Products", subtitle: "Catalog items across all categories" },
    "/manage/warehouses": { title: "Warehouses", subtitle: "Storage locations" },
    "/manage/suppliers": { title: "Suppliers", subtitle: "Raw material suppliers" },
    "/manage/production-units": { title: "Production Units", subtitle: "Internal and job-work lines" },
    "/manage/users": { title: "Users", subtitle: "App accounts and roles" },
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
    const location = useLocation();
    const routeHeading = ROUTE_HEADINGS[location.pathname];
    const displayTitle = title ?? routeHeading?.title;
    const displaySubtitle = subtitle ?? routeHeading?.subtitle;
    const { user } = useAuth();

    const initials = (user?.name ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <SidebarTrigger className="size-9 shrink-0 text-foreground/70" />
                <div className="min-w-0 leading-tight">
                    <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{displayTitle}</h1>
                    {displaySubtitle && (
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">{displaySubtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs md:flex">
                    <CalendarDays className="size-3.5 text-primary" />
                    {format(new Date(), "EEE, d MMM yyyy")}
                </div>
                <Avatar className="size-9 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

export default AppHeader;
