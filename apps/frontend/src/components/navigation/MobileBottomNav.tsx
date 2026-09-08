import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInventoryAlerts } from "@/hooks/useInventory";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Database,
} from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { data: alerts = [] } = useInventoryAlerts();

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/",
    },
    {
      to: "/inventory",
      label: "Inventory",
      icon: Package,
      active: location.pathname.startsWith("/inventory") && location.pathname !== "/inventory/alerts",
    },
    {
      to: "/inventory/alerts",
      label: "Alerts",
      icon: AlertTriangle,
      badge: alerts.length > 0 ? alerts.length : null,
      active: location.pathname === "/inventory/alerts",
    },
    ...(isAdmin
      ? [
          {
            to: "/manage",
            label: "Masters",
            icon: Database,
            active: location.pathname.startsWith("/manage"),
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 relative text-xs font-medium transition-colors ${
                item.active
                  ? "text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
