// src/pages/manage/ManageLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import { Permission } from "@robago/shared";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

const TABS = [
    { label: "Categories", to: "/manage/categories" },
    { label: "Products", to: "/manage/products" },
    { label: "Warehouses", to: "/manage/warehouses" },
    { label: "Suppliers", to: "/manage/suppliers" },
    { label: "Production Units", to: "/manage/production-units" },
    { label: "Users", to: "/manage/users" },
];

export default function ManageLayout() {
    const { can } = useAuth();
    const tabs = TABS.filter((t) => t.to !== "/manage/users" || can(Permission.UsersManage));
    return (
        <div>
            <div className="border-b border-slate-100 px-6">
                <nav className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                cn(
                                    "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-slate-500 hover:text-slate-800",
                                )
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <Outlet />
        </div>
    );
}
