// src/pages/staff/AttendanceSheet.tsx — month grid of daily attendance, one row per employee.
import { useMemo } from "react";
import { format, getDay } from "date-fns";
import SheetGrid, { type CellEdit, type SheetColumn } from "@/components/sheet/SheetGrid";
import { attendanceSummary, daysOfMonth, formatNumber, isoDate, pairKey, parseAttendance } from "@/lib/staff/calc";
import { staffActions } from "@/lib/staff/staffStore";
import { ATTENDANCE_LABEL, ATTENDANCE_VALUE, type AttendanceStatus, type Employee } from "@/lib/staff/types";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STYLE, EmployeeAvatar } from "./staffUi";

interface AttRow {
    emp: Employee;
    worked: number;
    absent: number;
}

const STATUSES: AttendanceStatus[] = ["P", "H", "A", "L"];
/** Click order: blank → Present → Absent → Half day → Leave → blank. */
const CLICK_CYCLE: (AttendanceStatus | null)[] = [null, "P", "A", "H", "L"];

interface Props {
    employees: Employee[];
    attendance: Record<string, AttendanceStatus>;
    month: Date;
}

export default function AttendanceSheet({ employees, attendance, month }: Props) {
    const days = useMemo(() => daysOfMonth(month), [month]);
    const todayIso = isoDate(new Date());

    const rows = useMemo<AttRow[]>(
        () =>
            employees.map((emp) => {
                const s = attendanceSummary(emp, attendance, days);
                return { emp, worked: s.workedDays, absent: s.absent };
            }),
        [employees, attendance, days],
    );

    const columns = useMemo<SheetColumn<AttRow>[]>(() => {
        const markOf = (r: AttRow, iso: string) => attendance[pairKey(r.emp.id, iso)];
        return [
            {
                id: "name",
                label: "Name",
                header: "Name",
                width: 190,
                sticky: true,
                getValue: (r) => r.emp.name,
                render: (r) => (
                    <span className="flex items-center gap-2">
                        <EmployeeAvatar name={r.emp.name} className="size-6 text-[9px]" />
                        <span
                            className={cn(
                                "truncate font-semibold",
                                !r.emp.active && "text-muted-foreground line-through",
                            )}
                        >
                            {r.emp.name}
                        </span>
                    </span>
                ),
                footer: () => <span className="text-muted-foreground">Present</span>,
            },
            {
                id: "worked",
                label: "Days worked",
                header: "Days",
                subHeader: "worked",
                width: 72,
                sticky: true,
                align: "center",
                getValue: (r) => r.worked,
                render: (r) => <span className="font-bold">{formatNumber(r.worked)}</span>,
                cellClassName: () => "bg-muted/60",
                footer: (rs) => formatNumber(rs.reduce((s, r) => s + r.worked, 0)),
            },
            ...days.map((d): SheetColumn<AttRow> => {
                const iso = isoDate(d);
                const sunday = getDay(d) === 0;
                const isToday = iso === todayIso;
                return {
                    id: `d:${iso}`,
                    label: format(d, "d MMM"),
                    header: (
                        <span
                            className={cn(
                                "inline-block min-w-6 rounded-md px-1 text-center text-[13px]",
                                isToday && "bg-primary text-primary-foreground",
                            )}
                        >
                            {format(d, "d")}
                        </span>
                    ),
                    subHeader: <span className={sunday ? "text-destructive" : undefined}>{format(d, "EEE")}</span>,
                    width: 52,
                    align: "center",
                    editable: true,
                    instantKeys: true,
                    getValue: (r) => markOf(r, iso) ?? null,
                    getNumber: (r) => {
                        const m = markOf(r, iso);
                        return m ? ATTENDANCE_VALUE[m] : null;
                    },
                    render: (r) => {
                        const m = markOf(r, iso);
                        return m ? <span className="font-bold">{m}</span> : null;
                    },
                    cellClassName: (r) => {
                        const m = markOf(r, iso);
                        if (m) return ATTENDANCE_STYLE[m];
                        return sunday ? "bg-muted/70" : undefined;
                    },
                    footer: (rs) => {
                        const n = rs.filter((r) => {
                            const m = markOf(r, iso);
                            return m === "P" || m === "H";
                        }).length;
                        return n || "";
                    },
                };
            }),
        ];
    }, [days, attendance, todayIso]);

    const handleEdit = (edits: CellEdit<AttRow>[]) => {
        const entries: { key: string; status: AttendanceStatus | null }[] = [];
        for (const { row, colId, text } of edits) {
            if (!colId.startsWith("d:")) continue;
            const status = parseAttendance(text);
            if (status !== undefined) entries.push({ key: pairKey(row.emp.id, colId.slice(2)), status });
        }
        if (entries.length) staffActions.setAttendance(entries);
    };

    const handleClick = (row: AttRow, colId: string) => {
        if (!colId.startsWith("d:")) return;
        const key = pairKey(row.emp.id, colId.slice(2));
        const idx = CLICK_CYCLE.indexOf(attendance[key] ?? null);
        void staffActions.setAttendance([{ key, status: CLICK_CYCLE[(idx + 1) % CLICK_CYCLE.length] ?? null }]);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {STATUSES.map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "grid size-5 place-items-center rounded-md text-[10px] font-bold",
                                ATTENDANCE_STYLE[s],
                            )}
                        >
                            {s}
                        </span>
                        {ATTENDANCE_LABEL[s]}
                    </span>
                ))}
                <span>
                    · <b className="font-semibold text-foreground">Click a day</b> to switch Present → Absent → Half day
                    → Leave → blank. Leave &amp; absent cut pay (half day = half).
                </span>
            </div>
            <SheetGrid
                rows={rows}
                columns={columns}
                getRowId={(r) => r.emp.id}
                onEdit={handleEdit}
                onCellClick={handleClick}
                formatStat={formatNumber}
                emptyMessage="No staff match your search."
                actions={({ cells }) => {
                    const dayCells = cells.filter((c) => c.col.id.startsWith("d:"));
                    if (!dayCells.length) return null;
                    const apply = (status: AttendanceStatus | null) =>
                        staffActions.setAttendance(
                            dayCells.map((c) => ({
                                key: pairKey(c.row.emp.id, c.col.id.slice(2)),
                                status,
                            })),
                        );
                    return (
                        <div className="flex items-center gap-1">
                            <span className="mr-1 hidden text-muted-foreground sm:inline">Mark</span>
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => apply(s)}
                                    title={ATTENDANCE_LABEL[s]}
                                    className={cn(
                                        "grid size-8 place-items-center rounded-lg text-xs font-bold transition-transform active:scale-95",
                                        ATTENDANCE_STYLE[s],
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => apply(null)}
                                className="h-8 rounded-lg border bg-card px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                Clear
                            </button>
                        </div>
                    );
                }}
            />
        </div>
    );
}
