// src/static/menuConfig.ts
import { LayoutDashboard, Package, AlertTriangle, Settings2 } from "lucide-react";

export interface MenuItem {
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
    /** Shown on both desktop sidebar and mobile bottom nav (Home/Manage/Inventory per the brief). */
    inBottomNav?: boolean;
}

const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, inBottomNav: true },
    { title: "Inventory", url: "/inventory", icon: Package, inBottomNav: true },
    { title: "Alerts", url: "/inventory/alerts", icon: AlertTriangle, inBottomNav: true },
    { title: "Manage", url: "/manage/categories", icon: Settings2, inBottomNav: true },
];

export default menuItems;
