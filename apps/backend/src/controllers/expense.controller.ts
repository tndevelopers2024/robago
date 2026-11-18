// src/controllers/expense.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as expenseService from "../services/expense.service.js";
import type {
    CreateExpenseInput,
    CreateExpensesBulkInput,
    CreateExpenseItemInput,
    ExpenseMonthQuery,
    ExpenseRangeQuery,
    UpdateExpenseInput,
    UpdateExpenseItemInput,
} from "@robago/shared";

const id = (req: Request) => req.params.id as string;

export const listItems = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await expenseService.listItems());
});
export const createItem = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await expenseService.createItem(req.body as CreateExpenseItemInput));
});
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await expenseService.updateItem(id(req), req.body as UpdateExpenseItemInput));
});
export const removeItem = asyncHandler(async (req: Request, res: Response) => {
    await expenseService.deleteItem(id(req));
    res.status(204).send();
});

export const list = asyncHandler(async (req: Request, res: Response) => {
    const { month } = (req as Request & { validatedQuery: ExpenseMonthQuery }).validatedQuery;
    res.status(200).json(await expenseService.listExpenses(month));
});
export const create = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await expenseService.createExpense(req.body as CreateExpenseInput));
});
export const createMany = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await expenseService.createExpenses((req.body as CreateExpensesBulkInput).entries));
});
export const update = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await expenseService.updateExpense(id(req), req.body as UpdateExpenseInput));
});
export const remove = asyncHandler(async (req: Request, res: Response) => {
    await expenseService.deleteExpense(id(req));
    res.status(204).send();
});
export const totals = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = (req as Request & { validatedQuery: ExpenseRangeQuery }).validatedQuery;
    res.status(200).json(await expenseService.getTotals(from, to));
});
