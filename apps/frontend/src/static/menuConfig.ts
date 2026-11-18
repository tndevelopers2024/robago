// src/static/menuConfig.ts
import { Permission } from "@robago/shared";
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    CalendarCheck2,
    Contact,
    GraduationCap,
    History,
    Landmark,
    LayoutDashboard,
    Package,
    LayoutDashboard as OverviewIcon,
    ListPlus,
    Receipt,
    Settings2,
    Table2,
    Tags,
    Users,
    type LucideIcon,
} from "lucide-react";

export interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    section: "Overview" | "Sales & operations" | "People & finance" | "Coming soon" | "Admin";
    /** Path prefix that keeps this item highlighted (defaults to `url`). */
    match?: string;
    /** Shown in the mobile bottom navigation. */
    inBottomNav?: boolean;
    /** Placeholder for a module that is planned but not built yet. */
    soon?: boolean;
    /** Who sees it: only roles holding this permission. Leave out for everyone. */
    permission?: Permission;
    /** Sub-pages, shown as an expandable group in the sidebar. */
    children?: { title: string; url: string; icon: LucideIcon }[];
}

const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, section: "Overview", inBottomNav: true },
    {
        title: "Staff",
        url: "/staff/salary",
        match: "/staff",
        icon: Users,
        section: "People & finance",
        permission: Permission.StaffManage,
        inBottomNav: true,
        children: [
            { title: "Salary sheet", url: "/staff/salary", icon: Table2 },
            { title: "Attendance", url: "/staff/attendance", icon: CalendarCheck2 },
            { title: "People", url: "/staff/people", icon: Contact },
        ],
    },
    {
        title: "School visits",
        url: "/crm/schools",
        match: "/crm",
        icon: GraduationCap,
        section: "Sales & operations",
        permission: Permission.CrmManage,
    },
    { title: "Inventory", url: "/inventory", icon: Package, section: "Sales & operations", permission: Permission.InventoryView, inBottomNav: true },
    {
        title: "Alerts",
        url: "/inventory/alerts",
        icon: AlertTriangle,
        section: "Sales & operations",
        permission: Permission.InventoryView,
    },
    {
        title: "Accounts",
        url: "/accounts/overview",
        match: "/accounts",
        icon: Landmark,
        section: "People & finance",
        permission: Permission.AccountsManage,
        children: [
            { title: "Overview", url: "/accounts/overview", icon: OverviewIcon },
            { title: "Creditors · to pay", url: "/accounts/creditors", icon: ArrowUpFromLine },
            { title: "Debtors · to collect", url: "/accounts/debtors", icon: ArrowDownToLine },
            { title: "Activity log", url: "/accounts/activity", icon: History },
        ],
    },
    {
        title: "Expenses",
        url: "/expenses/overview",
        match: "/expenses",
        icon: Receipt,
        section: "People & finance",
        permission: Permission.ExpensesManage,
        inBottomNav: true,
        children: [
            { title: "Overview", url: "/expenses/overview", icon: OverviewIcon },
            { title: "Entries", url: "/expenses/entries", icon: ListPlus },
            { title: "Month by month", url: "/expenses/monthly", icon: Table2 },
            { title: "Items", url: "/expenses/items", icon: Tags },
        ],
    },
    {
        title: "Manage",
        url: "/manage/categories",
        match: "/manage",
        icon: Settings2,
        section: "Admin",
        permission: Permission.CatalogManage,
        inBottomNav: true,
    },
];

export function isItemActive(item: MenuItem, pathname: string): boolean {
    if (item.url === "/") return pathname === "/";
    if (item.url === "/inventory/alerts") return pathname.startsWith("/inventory/alerts");
    if (item.url === "/inventory") {
        return pathname === "/inventory" || (pathname.startsWith("/inventory/") && !pathname.startsWith("/inventory/alerts"));
    }
    const prefix = item.match ?? item.url;
    return pathname === prefix || pathname.startsWith(prefix + "/");
}

export default menuItems;
