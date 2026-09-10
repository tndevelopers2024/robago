// src/components/layout/BottomNav.tsx
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import menuItems from "@/static/menuConfig";

/** Mobile-only persistent bottom nav — regraft's own mobile pattern is an off-canvas
 *  Sheet drawer triggered by SidebarTrigger (see components/ui/sidebar.tsx), not a
 *  persistent bar, so this component has no regraft equivalent to port. */
export function BottomNav() {
    const items = menuItems.filter((item) => item.inBottomNav);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
            {items.map((item) => (
                <NavLink
                    key={item.title}
                    to={item.url}
                    end={item.url === "/"}
                    className={({ isActive }) =>
                        cn(
                            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                            isActive ? "text-[#1565C0]" : "text-slate-500",
                        )
                    }
                >
                    <item.icon className="size-5" />
                    <span>{item.title}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;
