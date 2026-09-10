// src/pages/manage/ManageLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
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
    return (
        <div>
            <div className="border-b border-slate-100 px-6">
                <nav className="flex gap-1 overflow-x-auto">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                cn(
                                    "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "border-[#1565C0] text-[#1565C0]"
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
