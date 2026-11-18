// src/pages/staff/EmployeeProfile.tsx
// One person's full profile: hero summary, pay breakdown, advances, attendance calendar, details.
// Used inline on the People page (wide screens) and inside the slide-out drawer (everywhere else).
import { useMemo, useState, type ReactNode } from "react";
import { format, getDay, parseISO } from "date-fns";
import {
    BadgeIndianRupee,
    CalendarDays,
    Droplet,
    FileDown,
    Home,
    IdCard,
    Landmark,
    Pencil,
    Phone,
    ShieldAlert,
    Trash2,
    UserCheck,
    UserX,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import {
    attendanceSummary,
    daysOfMonth,
    formatINR,
    formatNumber,
    isoDate,
    pairKey,
    parseAmount,
    salarySummary,
    weeksOfMonth,
} from "@/lib/staff/calc";
import { monthKey, staffActions } from "@/lib/staff/staffStore";
import { downloadPayslip } from "@/lib/staff/payslip";
import { Switch } from "@/components/ui/switch";
import { ATTENDANCE_LABEL, type AttendanceStatus, type Employee, type PaymentRecord } from "@/lib/staff/types";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STYLE, EmployeeAvatar, PhonePill, UsageBar } from "./staffUi";

/** Click order on the calendar: blank → Present → Absent → Half day → Leave → blank. */
const CYCLE: (AttendanceStatus | null)[] = [null, "P", "A", "H", "L"];

interface Props {
    emp: Employee;
    month: Date;
    advances: Record<string, number>;
    attendance: Record<string, AttendanceStatus>;
    /** Set when this month's salary has been marked paid. */
    payment?: PaymentRecord;
    onEdit: () => void;
    onClose?: () => void;
    /** `panel`: two columns inside the page. `drawer`: one column inside the slide-out. */
    variant?: "panel" | "drawer";
    /** Heading element, so the drawer can supply an accessible dialog title. */
    title?: (name: string) => ReactNode;
}

export default function EmployeeProfile({
    emp,
    month,
    advances,
    attendance,
    payment,
    onEdit,
    onClose,
    variant = "panel",
    title,
}: Props) {
    const weeks = useMemo(() => weeksOfMonth(month), [month]);
    const days = useMemo(() => daysOfMonth(month), [month]);
    const sum = salarySummary(emp, advances, weeks, attendance, days);
    const att = attendanceSummary(emp, attendance, days);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const paymentMonth = monthKey(month);

    const togglePaid = (paid: boolean) =>
        void staffActions.setPayments([
            paid
                ? { employeeId: emp.id, month: paymentMonth, paid: true, amount: sum.balance }
                : { employeeId: emp.id, month: paymentMonth, paid: false },
        ]);

    const payslip = async () => {
        setDownloading(true);
        try {
            await downloadPayslip({ emp, month, summary: sum, attendance: att, weeks, advances, payment });
        } catch {
            toast.error("Couldn't create the payslip. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const wide = variant === "panel";
    const monthLabel = format(month, "MMMM yyyy");
    const subtitle = [emp.designation, emp.department].filter(Boolean).join(" · ");
    const leading = days[0] ? (getDay(days[0]) + 6) % 7 : 0; // Monday-first offset

    const cycleDay = (iso: string) => {
        const key = pairKey(emp.id, iso);
        const idx = CYCLE.indexOf(attendance[key] ?? null);
        void staffActions.setAttendance([{ key, status: CYCLE[(idx + 1) % CYCLE.length] ?? null }]);
    };

    const pay = (
        <Card icon={Wallet} title={`Pay · ${monthLabel}`}>
            <div className={cn(wide && "grid items-start gap-6 lg:grid-cols-2")}>
                <div>
                    <div className="rounded-xl bg-muted/50 p-3.5 text-sm">
                        <Line label="Monthly salary" value={formatINR(sum.salary)} />
                        <Line label="Less: advances given" value={`− ${formatINR(sum.advanceTotal)}`} />
                        <Line
                            label={`Less: leave (${formatNumber(sum.leaveDays)} ${sum.leaveDays === 1 ? "day" : "days"} × ${formatINR(Math.round(sum.perDay))})`}
                            value={`− ${formatINR(sum.leaveDeduction)}`}
                            tone={sum.leaveDeduction ? "bad" : undefined}
                        />
                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-bold">
                            <span>Balance to pay</span>
                            <span
                                className={cn(
                                    "font-heading text-lg tabular-nums",
                                    sum.balance < 0 ? "text-destructive" : "text-success",
                                )}
                            >
                                {formatINR(sum.balance)}
                            </span>
                        </div>
                    </div>
                    <label
                        className={cn(
                            "mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors",
                            payment ? "border-success/30 bg-success-soft" : "bg-card hover:bg-muted/40",
                        )}
                    >
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">Payment done for {monthLabel}</span>
                            <span className="block text-xs text-muted-foreground">
                                {payment
                                    ? `Paid ${formatINR(payment.amount)} on ${format(parseISO(payment.paidAt), "d MMM yyyy")}`
                                    : "Switch on once this month's salary has been paid"}
                            </span>
                            {payment && Math.round(payment.amount) !== Math.round(sum.balance) && (
                                <span className="mt-0.5 block text-xs font-medium text-warning">
                                    Net pay is now {formatINR(sum.balance)} — it changed after payment. Switch off and
                                    on to update.
                                </span>
                            )}
                        </span>
                        <Switch
                            checked={Boolean(payment)}
                            onCheckedChange={togglePaid}
                            aria-label={`Payment done for ${monthLabel}`}
                        />
                    </label>
                    <p className="mt-2 text-xs text-muted-foreground">
                        One day = salary ÷ 30. Leave and absent cut a full day, half day cuts half.
                    </p>
                </div>

                <div className={cn(!wide && "mt-4")}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground uppercase">Weekly advances</span>
                        <span className="text-muted-foreground">
                            {Math.round(sum.usedRatio * 100)}% of salary
                            {sum.balance < 0 && <b className="text-destructive"> · over-advanced</b>}
                        </span>
                    </div>
                    <UsageBar ratio={sum.usedRatio} className="mb-2 h-2" />
                    <div className="divide-y rounded-xl border">
                        {weeks.length === 0 && (
                            <p className="p-3 text-sm text-muted-foreground">No weekly columns this month.</p>
                        )}
                        {weeks.map((iso, i) => (
                            <AdvanceRow
                                key={iso + (advances[pairKey(emp.id, iso)] ?? "")}
                                label={`Week ${i + 1} · ${format(parseISO(iso), "EEE, d MMM")}`}
                                value={advances[pairKey(emp.id, iso)]}
                                onCommit={(n) =>
                                    void staffActions.setAdvances([{ key: pairKey(emp.id, iso), amount: n }])
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );

    const attendanceCard = (
        <Card icon={CalendarDays} title={`Attendance · ${monthLabel}`}>
            <div className={cn(wide && "grid items-start gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,30rem)]")}>
                <div className={cn("flex flex-wrap gap-1.5 text-xs", wide ? "content-start" : "mb-3")}>
                    <Pill className={ATTENDANCE_STYLE.P}>{att.present} present</Pill>
                    <Pill className={ATTENDANCE_STYLE.H}>{att.half} half</Pill>
                    <Pill className={ATTENDANCE_STYLE.A}>{att.absent} absent</Pill>
                    <Pill className={ATTENDANCE_STYLE.L}>{att.leave} leave</Pill>
                    {wide && (
                        <p className="mt-3 w-full text-xs text-muted-foreground">
                            Tap a day to switch: Present → Absent → Half day → Leave → clear.
                        </p>
                    )}
                </div>
                <div>
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "pb-1 text-[10px] font-semibold",
                                    i === 6 ? "text-destructive" : "text-muted-foreground",
                                )}
                            >
                                {d}
                            </span>
                        ))}
                        {Array.from({ length: leading }).map((_, i) => (
                            <span key={`pad${i}`} />
                        ))}
                        {days.map((d) => {
                            const iso = isoDate(d);
                            const mark = attendance[pairKey(emp.id, iso)];
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => cycleDay(iso)}
                                    title={mark ? ATTENDANCE_LABEL[mark] : "Not marked"}
                                    className={cn(
                                        "flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] leading-none transition-transform active:scale-90",
                                        mark
                                            ? ATTENDANCE_STYLE[mark] + " border-transparent"
                                            : "bg-card text-muted-foreground",
                                        getDay(d) === 0 && !mark && "bg-muted/70",
                                    )}
                                >
                                    <span className="opacity-70">{d.getDate()}</span>
                                    <span className="mt-0.5 text-[12px] font-bold">{mark ?? ""}</span>
                                </button>
                            );
                        })}
                    </div>
                    {!wide && (
                        <p className="mt-2.5 text-xs text-muted-foreground">
                            Tap a day: Present → Absent → Half day → Leave → clear.
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );

    const details = (
        <Card icon={IdCard} title="Personal details">
            <dl className="divide-y rounded-xl border text-sm">
                <Detail icon={Phone} label="Phone" value={emp.phone} />
                <Detail
                    icon={ShieldAlert}
                    label="Emergency contact"
                    value={[emp.emergencyName, emp.emergencyPhone].filter(Boolean).join(" · ")}
                />
                <Detail
                    icon={CalendarDays}
                    label="Date of birth"
                    value={emp.dob ? format(parseISO(emp.dob), "d MMM yyyy") : ""}
                />
                <Detail
                    icon={CalendarDays}
                    label="Joined on"
                    value={emp.joinedOn ? format(parseISO(emp.joinedOn), "d MMM yyyy") : ""}
                />
                <Detail icon={Droplet} label="Blood group" value={emp.bloodGroup} />
                <Detail icon={Home} label="Address" value={emp.address} />
                <Detail icon={IdCard} label="Aadhaar" value={emp.aadhaar} />
            </dl>
        </Card>
    );

    const bank = (
        <Card icon={Landmark} title="Bank & payment">
            <dl className="divide-y rounded-xl border text-sm">
                <Detail icon={Landmark} label="Bank account" value={emp.bankAccount} />
                <Detail icon={Landmark} label="IFSC" value={emp.ifsc} />
                <Detail icon={BadgeIndianRupee} label="UPI" value={emp.upi} />
            </dl>
            {emp.notes && (
                <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {emp.notes}
                </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                        void staffActions
                            .updateEmployee(emp.id, { active: !emp.active })
                            .catch((err) => toast.error(getErrorMessage(err, "Couldn't update this employee.")))
                    }
                >
                    {emp.active ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                    {emp.active ? "Mark inactive" : "Mark active"}
                </Button>
                {confirmDelete ? (
                    <>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                                void staffActions
                                    .deleteEmployee(emp.id)
                                    .then(() => onClose?.())
                                    .catch((err) => toast.error(getErrorMessage(err, "Couldn't delete this employee.")))
                            }
                        >
                            Yes, delete permanently
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className="size-3.5" /> Delete
                    </Button>
                )}
            </div>
        </Card>
    );

    return (
        <div className={cn("space-y-4", !wide && "p-4")}>
            {/* Hero */}
            <div
                className={cn(
                    "relative overflow-hidden bg-sidebar text-white",
                    wide ? "rounded-2xl p-6" : "rounded-2xl p-5",
                )}
            >
                <div className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full bg-brand/30 blur-3xl" />
                <div className="relative flex flex-wrap items-start gap-4">
                    <EmployeeAvatar name={emp.name} className="size-16 text-xl ring-2 ring-white/20" />
                    <div className="min-w-0 flex-1">
                        {title ? (
                            title(emp.name)
                        ) : (
                            <h2 className="font-heading truncate text-2xl font-semibold text-white">{emp.name}</h2>
                        )}
                        <p className="truncate text-sm text-white/60">{subtitle || "Add designation & department"}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <PhonePill status={emp.phoneStatus} />
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    emp.active ? "bg-white/15" : "bg-destructive/40",
                                )}
                            >
                                {emp.active ? "Active" : "Inactive"}
                            </span>
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    payment ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/15 text-amber-300",
                                )}
                            >
                                {payment ? `${format(month, "MMM")} salary paid ✓` : `${format(month, "MMM")} salary pending`}
                            </span>
                            {emp.joinedOn && (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                                    Since {format(parseISO(emp.joinedOn), "d MMM yyyy")}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => void payslip()}
                            disabled={downloading}
                            className="gap-1.5 bg-brand text-sidebar hover:bg-brand/90"
                        >
                            <FileDown className="size-3.5" /> {downloading ? "Preparing…" : "Payslip"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={onEdit} className="gap-1.5">
                            <Pencil className="size-3.5" /> Edit
                        </Button>
                        {emp.phone && (
                            <Button size="sm" variant="secondary" asChild className="gap-1.5">
                                <a href={`tel:${emp.phone}`}>
                                    <Phone className="size-3.5" /> Call
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                    <HeroStat
                        label={`To pay · ${format(month, "MMM")}`}
                        value={formatINR(sum.balance)}
                        tone={sum.balance < 0 ? "bad" : "good"}
                    />
                    <HeroStat label="Days worked" value={formatNumber(att.workedDays)} />
                    <HeroStat
                        label="Pay-cut days"
                        value={formatNumber(sum.leaveDays)}
                        tone={sum.leaveDays ? "bad" : undefined}
                    />
                </div>
            </div>

            {pay}
            <div className="grid items-start gap-4 xl:grid-cols-2">
                {details}
                {bank}
            </div>
            {attendanceCard}
        </div>
    );
}

function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
            <h3 className="font-heading mb-3.5 flex items-center gap-2 text-base font-semibold">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                </span>
                {title}
            </h3>
            {children}
        </section>
    );
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold tracking-wide text-white/50 uppercase">{label}</p>
            <p
                className={cn(
                    "font-heading mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl",
                    tone === "good" && "text-emerald-300",
                    tone === "bad" && "text-red-300",
                )}
            >
                {value}
            </p>
        </div>
    );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1 text-muted-foreground">
            <span>{label}</span>
            <span className={cn("font-medium tabular-nums", tone === "bad" ? "text-destructive" : "text-foreground")}>
                {value}
            </span>
        </div>
    );
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
    return <span className={cn("rounded-full px-2.5 py-1 font-semibold", className)}>{children}</span>;
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 px-3 py-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
            <dd className={cn("min-w-0 flex-1 break-words", !value && "text-muted-foreground/60")}>{value || "—"}</dd>
        </div>
    );
}

function AdvanceRow({
    label,
    value,
    onCommit,
}: {
    label: string;
    value: number | undefined;
    onCommit: (n: number | null) => void;
}) {
    const [text, setText] = useState(value ? String(value) : "");
    const commit = () => {
        const n = parseAmount(text);
        if (n === undefined) {
            setText(value ? String(value) : "");
            return;
        }
        if ((n ?? 0) !== (value ?? 0)) onCommit(n);
    };
    return (
        <label className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm">{label}</span>
            <span className="flex items-center gap-1 rounded-lg border bg-background px-2 focus-within:ring-2 focus-within:ring-primary/40">
                <span className="text-sm text-muted-foreground">₹</span>
                <input
                    inputMode="decimal"
                    value={text}
                    placeholder="0"
                    onChange={(e) => setText(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className="h-9 w-24 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
                />
            </span>
        </label>
    );
}
