// src/controllers/staff.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as staffService from "../services/staff.service.js";
import type {
    CreateEmployeeInput,
    LedgerQuery,
    SetAdvancesInput,
    SetAttendanceInput,
    SetPaymentsInput,
    UpdateEmployeeInput,
} from "@robago/shared";

export const list = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await staffService.listEmployees());
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await staffService.createEmployee(req.body as CreateEmployeeInput));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await staffService.updateEmployee(req.params.id as string, req.body as UpdateEmployeeInput));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await staffService.deleteEmployee(req.params.id as string);
    res.status(204).send();
});

export const ledger = asyncHandler(async (req: Request, res: Response) => {
    const { month } = (req as Request & { validatedQuery: LedgerQuery }).validatedQuery;
    res.status(200).json(await staffService.getLedger(month));
});

export const setAdvances = asyncHandler(async (req: Request, res: Response) => {
    await staffService.setAdvances((req.body as SetAdvancesInput).entries);
    res.status(204).send();
});

export const setAttendance = asyncHandler(async (req: Request, res: Response) => {
    await staffService.setAttendance((req.body as SetAttendanceInput).entries);
    res.status(204).send();
});

export const setPayments = asyncHandler(async (req: Request, res: Response) => {
    await staffService.setPayments((req.body as SetPaymentsInput).entries);
    res.status(204).send();
});
