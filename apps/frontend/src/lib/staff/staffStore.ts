// src/lib/staff/staffStore.ts
//
// Staff data comes from the API (TanStack Query). Edits are applied to the cache straight
// away — so the sheet feels instant like Excel — and sent to the server in the background;
// if the server rejects a save, the change is rolled back by refetching and a toast explains.
import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
    AdvanceEntry,
    AttendanceEntry,
    CreateEmployeeInput,
    LedgerDTO,
    PaymentEntry,
    UpdateEmployeeInput,
} from "@robago/shared";
import * as staffApi from "@/api/staff";
import queryClient from "@/lib/queryClient";
import { getErrorMessage } from "@/lib/errors";
import type { AttendanceStatus, Employee, StaffState } from "./types";

export const staffKeys = {
    all: ["staff"] as const,
    employees: () => ["staff", "employees"] as const,
    ledgers: () => ["staff", "ledger"] as const,
    ledger: (month: string) => ["staff", "ledger", month] as const,
};

export const monthKey = (d: Date) => format(d, "yyyy-MM");

const NO_EMPLOYEES: Employee[] = [];

export function useEmployees() {
    return useQuery({
        queryKey: staffKeys.employees(),
        queryFn: staffApi.getEmployees,
    });
}

export function useStaff(month: Date) {
    const key = monthKey(month);
    const nowKey = monthKey(new Date());
    const employeesQ = useEmployees();
    // While another month loads, keep showing the previous one (dimmed) rather than blanking the page.
    const ledgerQ = useQuery({
        queryKey: staffKeys.ledger(key),
        queryFn: () => staffApi.getLedger(key),
        placeholderData: keepPreviousData,
    });
    // "Present today" needs the current month even while you browse another one.
    const nowQ = useQuery({
        queryKey: staffKeys.ledger(nowKey),
        queryFn: () => staffApi.getLedger(nowKey),
        enabled: nowKey !== key,
    });

    const state = useMemo<StaffState>(() => {
        const advances: StaffState["advances"] = {};
        const attendance: StaffState["attendance"] = {};
        const payments: StaffState["payments"] = {};
        for (const ledger of [nowQ.data, ledgerQ.data]) {
            if (!ledger) continue;
            for (const p of ledger.payments)
                payments[`${p.employeeId}|${p.month}`] = {
                    amount: p.amount,
                    paidAt: p.paidAt,
                };
            for (const a of ledger.advances) advances[`${a.employeeId}|${a.weekStart}`] = a.amount;
            for (const a of ledger.attendance) attendance[`${a.employeeId}|${a.date}`] = a.status;
        }
        return {
            employees: employeesQ.data ?? NO_EMPLOYEES,
            advances,
            attendance,
            payments,
        };
    }, [employeesQ.data, ledgerQ.data, nowQ.data]);

    return {
        ...state,
        isLoading: employeesQ.isPending || ledgerQ.isPending,
        /** True while the previous month stands in for the one being loaded. */
        refreshing: ledgerQ.isPlaceholderData,
        error: employeesQ.error ?? ledgerQ.error ?? null,
        refetch: () => {
            void employeesQ.refetch();
            void ledgerQ.refetch();
        },
    };
}

// ---- optimistic helpers ---------------------------------------------------------------------

function patchLedger(month: string, fn: (l: LedgerDTO) => LedgerDTO) {
    queryClient.setQueryData<LedgerDTO>(staffKeys.ledger(month), (old) => (old ? fn(old) : old));
}

/** Runs an optimistic cache edit, then the server call; rolls back (by refetching) on failure. */
async function saveInBackground(what: string, optimistic: () => void, call: () => Promise<unknown>) {
    await queryClient.cancelQueries({ queryKey: staffKeys.all });
    optimistic();
    try {
        await call();
        void queryClient.invalidateQueries({
            queryKey: staffKeys.all,
            refetchType: "none",
        });
    } catch (err) {
        toast.error(getErrorMessage(err, `Couldn't save ${what}. Your change was undone.`));
        void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    }
}

const splitKey = (key: string): [string, string] => {
    const [id = "", date = ""] = key.split("|");
    return [id, date];
};

export const staffActions = {
    async addEmployee(input: CreateEmployeeInput): Promise<Employee> {
        const created = await staffApi.createEmployee(input);
        queryClient.setQueryData<Employee[]>(staffKeys.employees(), (old) => [...(old ?? []), created]);
        return created;
    },

    async updateEmployee(id: string, patch: UpdateEmployeeInput): Promise<Employee> {
        const updated = await staffApi.updateEmployee(id, patch);
        queryClient.setQueryData<Employee[]>(staffKeys.employees(), (old) =>
            old?.map((e) => (e.id === id ? updated : e)),
        );
        return updated;
    },

    /** Spreadsheet edits: several employees at once, applied instantly. */
    patchEmployees(patches: Record<string, UpdateEmployeeInput>) {
        return saveInBackground(
            "the staff changes",
            () =>
                queryClient.setQueryData<Employee[]>(staffKeys.employees(), (old) =>
                    old?.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
                ),
            () => Promise.all(Object.entries(patches).map(([id, p]) => staffApi.updateEmployee(id, p))),
        );
    },

    async deleteEmployee(id: string) {
        await staffApi.deleteEmployee(id);
        queryClient.setQueryData<Employee[]>(staffKeys.employees(), (old) => old?.filter((e) => e.id !== id));
        queryClient.setQueriesData<LedgerDTO>({ queryKey: staffKeys.ledgers() }, (old) =>
            old
                ? {
                      ...old,
                      advances: old.advances.filter((a) => a.employeeId !== id),
                      attendance: old.attendance.filter((a) => a.employeeId !== id),
                      payments: old.payments.filter((a) => a.employeeId !== id),
                  }
                : old,
        );
    },

    /** Set (or clear with null) weekly advances. Keys are `${employeeId}|${weekStart}`. */
    setAdvances(entries: { key: string; amount: number | null }[]) {
        const parsed: AdvanceEntry[] = entries.map((e) => {
            const [employeeId, weekStart] = splitKey(e.key);
            return { employeeId, weekStart, amount: e.amount };
        });
        return saveInBackground(
            "the advance",
            () => {
                for (const month of new Set(parsed.map((p) => p.weekStart.slice(0, 7)))) {
                    patchLedger(month, (l) => {
                        const touched = new Set(parsed.map((p) => `${p.employeeId}|${p.weekStart}`));
                        const kept = l.advances.filter((a) => !touched.has(`${a.employeeId}|${a.weekStart}`));
                        const added = parsed
                            .filter((p) => p.weekStart.startsWith(month) && p.amount)
                            .map((p) => ({
                                employeeId: p.employeeId,
                                weekStart: p.weekStart,
                                amount: p.amount as number,
                            }));
                        return { ...l, advances: [...kept, ...added] };
                    });
                }
            },
            () => staffApi.setAdvances(parsed),
        );
    },

    /** Mark (or clear with null) attendance. Keys are `${employeeId}|${date}`. */
    setAttendance(entries: { key: string; status: AttendanceStatus | null }[]) {
        const parsed: AttendanceEntry[] = entries.map((e) => {
            const [employeeId, date] = splitKey(e.key);
            return { employeeId, date, status: e.status };
        });
        return saveInBackground(
            "attendance",
            () => {
                for (const month of new Set(parsed.map((p) => p.date.slice(0, 7)))) {
                    patchLedger(month, (l) => {
                        const touched = new Set(parsed.map((p) => `${p.employeeId}|${p.date}`));
                        const kept = l.attendance.filter((a) => !touched.has(`${a.employeeId}|${a.date}`));
                        const added = parsed
                            .filter((p) => p.date.startsWith(month) && p.status)
                            .map((p) => ({
                                employeeId: p.employeeId,
                                date: p.date,
                                status: p.status as AttendanceStatus,
                            }));
                        return { ...l, attendance: [...kept, ...added] };
                    });
                }
            },
            () => staffApi.setAttendance(parsed),
        );
    },

    /** Mark salary paid (with the net amount handed over) or undo it, for one or many people. */
    setPayments(entries: PaymentEntry[]) {
        return saveInBackground(
            "the payment status",
            () => {
                for (const month of new Set(entries.map((e) => e.month))) {
                    patchLedger(month, (l) => {
                        const touched = new Set(entries.map((e) => e.employeeId));
                        const kept = l.payments.filter((p) => !(p.month === month && touched.has(p.employeeId)));
                        const added = entries
                            .filter((e) => e.month === month && e.paid)
                            .map((e) => {
                                const before = l.payments.find((p) => p.employeeId === e.employeeId);
                                return {
                                    employeeId: e.employeeId,
                                    month,
                                    amount: e.amount ?? 0,
                                    paidAt: before?.paidAt ?? new Date().toISOString(),
                                };
                            });
                        return { ...l, payments: [...kept, ...added] };
                    });
                }
            },
            () => staffApi.setPayments(entries),
        );
    },
};
