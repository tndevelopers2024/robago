// src/api/expenses.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type {
    CreateExpenseInput,
    CreateExpenseItemInput,
    ExpenseDTO,
    ExpenseItemDTO,
    ExpenseTotalDTO,
    UpdateExpenseInput,
    UpdateExpenseItemInput,
} from "@robago/shared";

export async function getItems(): Promise<ExpenseItemDTO[]> {
    return (await axiosInstance.get<ExpenseItemDTO[]>("/expenses/items")).data;
}
export async function createItem(input: CreateExpenseItemInput): Promise<ExpenseItemDTO> {
    return (await axiosInstance.post<ExpenseItemDTO>("/expenses/items", input)).data;
}
export async function updateItem(id: string, input: UpdateExpenseItemInput): Promise<ExpenseItemDTO> {
    return (await axiosInstance.patch<ExpenseItemDTO>(`/expenses/items/${id}`, input)).data;
}
export async function deleteItem(id: string): Promise<void> {
    await axiosInstance.delete(`/expenses/items/${id}`);
}

export async function getExpenses(month: string): Promise<ExpenseDTO[]> {
    return (await axiosInstance.get<ExpenseDTO[]>("/expenses", { params: { month } })).data;
}
export async function createExpense(input: CreateExpenseInput): Promise<ExpenseDTO> {
    return (await axiosInstance.post<ExpenseDTO>("/expenses", input)).data;
}
export async function createExpensesBulk(entries: CreateExpenseInput[]): Promise<ExpenseDTO[]> {
    return (await axiosInstance.post<ExpenseDTO[]>("/expenses/bulk", { entries })).data;
}
export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<ExpenseDTO> {
    return (await axiosInstance.patch<ExpenseDTO>(`/expenses/${id}`, input)).data;
}
export async function deleteExpense(id: string): Promise<void> {
    await axiosInstance.delete(`/expenses/${id}`);
}
export async function getTotals(from: string, to: string): Promise<ExpenseTotalDTO[]> {
    return (await axiosInstance.get<ExpenseTotalDTO[]>("/expenses/totals", { params: { from, to } })).data;
}
