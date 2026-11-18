import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";
import menuItems, { isItemActive } from "@/static/menuConfig";

export function BottomNav() {
    const location = useLocation();
    const { can } = useAuth();
    const items = menuItems.filter((item) => item.inBottomNav && (!item.permission || can(item.permission)));

    return (
        <nav
            aria-label="Primary"
            className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/90 backdrop-blur-xl md:hidden"
        >
            <ul className="mx-auto flex h-16 max-w-lg items-stretch px-1">
                {items.map((item) => {
                    const active = isItemActive(item, location.pathname);
                    return (
                        <li key={item.title} className="flex-1">
                            <NavLink
                                to={item.url}
                                className={cn(
                                    "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                                    active ? "text-primary" : "text-muted-foreground active:text-foreground",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-7 w-12 items-center justify-center rounded-full transition-all",
                                        active && "bg-primary/10",
                                    )}
                                >
                                    <item.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                                </span>
                                <span>{item.title}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default BottomNav;
