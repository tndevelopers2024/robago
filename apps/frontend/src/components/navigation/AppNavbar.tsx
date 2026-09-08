import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInventoryAlerts } from "@/hooks/useInventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Database,
  LogOut,
  Boxes,
} from "lucide-react";

export function AppNavbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const { data: alerts = [] } = useInventoryAlerts();

  const navLinks = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/",
    },
    {
      to: "/inventory",
      label: "Inventory Explorer",
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
            label: "Master Hub",
            icon: Database,
            active: location.pathname.startsWith("/manage"),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  ROBAGO
                </span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                Manufacturing & Inventory
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 border-r border-slate-200 pr-3">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-slate-500">
                  {user.phoneNumber}
                </span>
              </div>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="capitalize"
              >
                {user.role}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
