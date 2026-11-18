// The top of the dashboard: a greeting, the headline number, and one-click shortcuts.
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
    AlertTriangle,
    ArrowRight,
    CalendarCheck2,
    Package,
    Plus,
    ReceiptText,
    Sparkles,
    Warehouse,
} from "lucide-react";
import { Permission } from "@robago/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { rupees } from "@/lib/expenses/calc";
import AnimatedNumber from "./AnimatedNumber";
import GlassCard from "./GlassCard";

interface Props {
    name?: string;
    /** Which shortcuts to offer — only the ones this person's role allows. */
    can: (permission: Permission) => boolean;
    loading: boolean;
    totalValuation: number;
    skuCount: number;
    godownShare: number; // 0–100
    alertCount: number;
}

function greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const ACTIONS = [
    { to: "/expenses/overview?add=1", label: "Add expense", icon: Plus, needs: Permission.ExpensesManage },
    { to: "/staff/attendance", label: "Mark attendance", icon: CalendarCheck2, needs: Permission.StaffManage },
    { to: "/inventory", label: "Stock & transactions", icon: Package, needs: Permission.InventoryView },
    { to: "/expenses/overview", label: "Spending report", icon: ReceiptText, needs: Permission.ExpensesManage },
];

export default function HeroPanel({
    name,
    can,
    loading,
    totalValuation,
    skuCount,
    godownShare,
    alertCount,
}: Props) {
    return (
        <GlassCard tone="ink" className="p-6 sm:p-8">
            {/* decorative glow orbs, kept inside the card */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand/30 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-primary/30 blur-3xl"
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-sky-200/80">
                        <Sparkles className="size-4 text-brand" />
                        {greeting()}
                        {name ? `, ${name.split(" ")[0]}` : ""} · {format(new Date(), "EEEE, d MMMM")}
                    </p>
                    <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
                        Total inventory value
                    </p>
                    {loading ? (
                        <Skeleton className="mt-2 h-14 w-72 bg-white/10" />
                    ) : (
                        <p className="mt-1 text-5xl font-semibold tracking-tight sm:text-6xl">
                            <AnimatedNumber value={totalValuation} format={rupees} duration={1200} />
                        </p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <Pill icon={Package}>{loading ? "—" : skuCount} items in stock</Pill>
                        <Pill icon={Warehouse}>{loading ? "—" : `${godownShare}%`} in the godown</Pill>
                        <Link
                            to="/inventory/alerts"
                            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all hover:gap-2.5 ${alertCount ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/30 hover:bg-amber-400/25" : "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20"}`}
                        >
                            <AlertTriangle className="size-3.5" />
                            {alertCount
                                ? `${alertCount} low-stock alert${alertCount === 1 ? "" : "s"}`
                                : "Stock levels healthy"}
                            {alertCount > 0 && <ArrowRight className="size-3.5" />}
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {ACTIONS.filter((a) => can(a.needs)).map((a) => (
                        <Link
                            key={a.to + a.label}
                            to={a.to}
                            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-white/10 hover:shadow-[0_0_28px_-4px_rgba(56,189,248,0.55)]"
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/30 transition-transform duration-300 group-hover:scale-110">
                                <a.icon className="size-4" />
                            </span>
                            <span className="leading-tight">{a.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
}

function Pill({ icon: Icon, children }: { icon: typeof Package; children: React.ReactNode }) {
    return (
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm font-medium text-white/85 ring-1 ring-white/10">
            <Icon className="size-3.5 text-brand" />
            {children}
        </span>
    );
}
