import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import menuItems from "@/static/menuConfig";

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

export function BottomNav() {
    const location = useLocation();
    const items = menuItems.filter((item) => item.inBottomNav);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
            {items.map((item) => {
                const active = isItemActive(item.url, location.pathname);
                return (
                    <NavLink
                        key={item.title}
                        to={item.url}
                        className={cn(
                            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                            active ? "text-[#1565C0]" : "text-slate-500",
                        )}
                    >
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}

export default BottomNav;
