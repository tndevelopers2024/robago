// src/pages/staff/staffContext.ts — what the Staff layout shares with its three sub-pages.
import { useOutletContext } from "react-router-dom";
import type { AttendanceStatus, Employee, PaymentRecord } from "@/lib/staff/types";

export interface StaffOutletContext {
    /** Employees after the search / inactive filters. */
    employees: Employee[];
    advances: Record<string, number>;
    attendance: Record<string, AttendanceStatus>;
    payments: Record<string, PaymentRecord>;
    month: Date;
    openEmployee: (id: string) => void;
    editEmployee: (id: string) => void;
    addEmployee: () => void;
}

export const useStaffContext = () => useOutletContext<StaffOutletContext>();
