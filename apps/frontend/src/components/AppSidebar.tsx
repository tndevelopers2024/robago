// src/components/AppSidebar.tsx
import { roleLabel } from "@robago/shared";
import { useAuth } from "@/context/AuthProvider";
import menuItems, { isItemActive } from "@/static/menuConfig";
import { ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SECTIONS = ["Overview", "Sales & operations", "People & finance", "Coming soon", "Admin"] as const;
/** The first group (just the Dashboard) needs no heading. */
const UNLABELLED = new Set<string>(["Overview"]);

/** The menu icon sits in a small rounded tile that lights up when its page is open. */
function NavIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
    return (
        <span
            className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 group-data-[collapsible=icon]:size-9",
                active
                    ? "bg-linear-to-br from-sidebar-primary to-primary text-white shadow-md shadow-sidebar-primary/30"
                    : "bg-white/5 text-white/60 group-hover/menu-item:bg-white/10 group-hover/menu-item:text-white",
            )}
        >
            <Icon className="size-[17px]" />
        </span>
    );
}

const ITEM =
    "h-11 gap-3 rounded-xl px-2 text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white " +
    "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span:last-child]:hidden " +
    "data-[active=true]:bg-white/10 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]";

const AppSidebar = () => {
    const { logout, user, can } = useAuth();
    const location = useLocation();
    const { setOpenMobile, state, isMobile } = useSidebar();
    const railOnly = state === "collapsed" && !isMobile;
    // Groups open on their own when you are inside them, and you can still toggle them by hand.
    const [toggled, setToggled] = useState<Record<string, boolean>>({});

    const initials = (user?.name ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Sidebar collapsible="icon" className="border-r-0">
            <SidebarHeader className="relative overflow-hidden px-3 pt-5 pb-3">
                <div className="pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-sidebar-primary/25 blur-3xl" />
                <div className="relative flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-black/20 ring-1 ring-white/10">
                        <img src="/images/robago-logo.png" alt="Robago" className="size-full object-contain" />
                    </div>
                    <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="text-[15px] font-semibold tracking-wide text-white">ROBAGO</span>
                        <span className="text-[11px] font-medium tracking-wider text-sidebar-primary uppercase">
                            Business suite
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="scrollbar-none gap-0 px-2 py-2">
                {SECTIONS.map((section) => {
                    const items = menuItems.filter(
                        (i) => i.section === section && (!i.permission || can(i.permission)),
                    );
                    if (!items.length) return null;
                    return (
                        <SidebarGroup
                            key={section}
                            className="px-1 py-2.5 group-data-[collapsible=icon]:border-t group-data-[collapsible=icon]:border-white/10 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:first:border-t-0"
                        >
                            {!UNLABELLED.has(section) && (
                                <SidebarGroupLabel className="mb-1 h-7 gap-2 px-2 text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase after:h-px after:flex-1 after:bg-white/10 after:content-['']">
                                    {section}
                                </SidebarGroupLabel>
                            )}
                            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-2">
                                {items.map((item) => {
                                    const active = !item.soon && isItemActive(item, location.pathname);
                                    if (item.children && !railOnly) {
                                        const open = toggled[item.title] ?? active;
                                        return (
                                            <Collapsible.Root
                                                key={item.title}
                                                asChild
                                                open={open}
                                                onOpenChange={(o) => setToggled((g) => ({ ...g, [item.title]: o }))}
                                            >
                                                <SidebarMenuItem>
                                                    <Collapsible.Trigger asChild>
                                                        <SidebarMenuButton isActive={active && !open} className={ITEM}>
                                                            <NavIcon icon={item.icon} active={active} />
                                                            <span className={active ? "text-white" : undefined}>
                                                                {item.title}
                                                            </span>
                                                            <ChevronRight
                                                                className={`ml-auto size-4 text-white/40 transition-transform ${open ? "rotate-90" : ""}`}
                                                            />
                                                        </SidebarMenuButton>
                                                    </Collapsible.Trigger>
                                                    <Collapsible.Content>
                                                        <SidebarMenuSub className="mx-0 mt-1.5 ml-[22px] gap-0.5 border-l border-white/10 pr-0 pl-3">
                                                            {item.children.map((child) => {
                                                                const childActive = location.pathname === child.url;
                                                                return (
                                                                    <SidebarMenuSubItem key={child.url}>
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={childActive}
                                                                            className="h-9 rounded-lg px-2.5 text-[13px] text-white/60 hover:bg-white/5 hover:text-white data-[active=true]:bg-linear-to-r data-[active=true]:from-sidebar-primary/25 data-[active=true]:to-transparent data-[active=true]:font-semibold data-[active=true]:text-white"
                                                                        >
                                                                            <NavLink
                                                                                to={child.url}
                                                                                onClick={() => setOpenMobile(false)}
                                                                            >
                                                                                <child.icon
                                                                                    className={
                                                                                        childActive
                                                                                            ? "text-sidebar-primary"
                                                                                            : "text-white/50"
                                                                                    }
                                                                                />
                                                                                <span>{child.title}</span>
                                                                            </NavLink>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </Collapsible.Content>
                                                </SidebarMenuItem>
                                            </Collapsible.Root>
                                        );
                                    }
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            {item.soon ? (
                                                <>
                                                    <SidebarMenuButton
                                                        disabled
                                                        tooltip={`${item.title} (soon)`}
                                                        className="h-10 rounded-lg px-3 text-white/40 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
                                                    >
                                                        <item.icon className="size-[18px] group-data-[collapsible=icon]:size-5" />
                                                        <span>{item.title}</span>
                                                    </SidebarMenuButton>
                                                    <SidebarMenuBadge className="top-2.5! right-2 rounded-md bg-white/10 px-1.5 text-[9px] font-semibold tracking-wide text-white/60 uppercase">
                                                        Soon
                                                    </SidebarMenuBadge>
                                                </>
                                            ) : (
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={active}
                                                    tooltip={item.title}
                                                    className={ITEM}
                                                >
                                                    <NavLink to={item.url} onClick={() => setOpenMobile(false)}>
                                                        <NavIcon icon={item.icon} active={active} />
                                                        <span>{item.title}</span>
                                                    </NavLink>
                                                </SidebarMenuButton>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarFooter className="p-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2 ring-1 ring-white/5 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:ring-0">
                    <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-[13px] font-semibold text-white">{user?.name}</p>
                        <p className="text-[11px] text-white/50">{roleLabel(user?.role)}</p>
                    </div>
                    <button
                        onClick={() => void logout()}
                        aria-label="Log out"
                        className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
};

export default AppSidebar;
