// src/api/staff.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type {
    AdvanceEntry,
    AttendanceEntry,
    CreateEmployeeInput,
    EmployeeDTO,
    LedgerDTO,
    PaymentEntry,
    UpdateEmployeeInput,
} from "@robago/shared";

export async function getEmployees(): Promise<EmployeeDTO[]> {
    const { data } = await axiosInstance.get<EmployeeDTO[]>("/staff");
    return data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDTO> {
    const { data } = await axiosInstance.post<EmployeeDTO>("/staff", input);
    return data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<EmployeeDTO> {
    const { data } = await axiosInstance.patch<EmployeeDTO>(`/staff/${id}`, input);
    return data;
}

export async function deleteEmployee(id: string): Promise<void> {
    await axiosInstance.delete(`/staff/${id}`);
}

/** Advances and attendance for one month (`YYYY-MM`). */
export async function getLedger(month: string): Promise<LedgerDTO> {
    const { data } = await axiosInstance.get<LedgerDTO>("/staff/ledger", { params: { month } });
    return data;
}

export async function setAdvances(entries: AdvanceEntry[]): Promise<void> {
    await axiosInstance.put("/staff/advances", { entries });
}

export async function setAttendance(entries: AttendanceEntry[]): Promise<void> {
    await axiosInstance.put("/staff/attendance", { entries });
}

export async function setPayments(entries: PaymentEntry[]): Promise<void> {
    await axiosInstance.put("/staff/payments", { entries });
}
