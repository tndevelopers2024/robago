// src/controllers/accounts.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as accounts from "../services/accounts.service.js";
import type {
    AccountListQuery,
    ActivityQuery,
    CreateAccountInput,
    CreateEntryInput,
    SendReminderInput,
    UpdateAccountInput,
    VoidEntryInput,
} from "@robago/shared";

const id = (req: Request) => req.params.id as string;
const actor = (req: Request) => accounts.resolveActor(req.user);
const query = <T>(req: Request) => (req as Request & { validatedQuery: T }).validatedQuery;

export const list = asyncHandler(async (req: Request, res: Response) => {
    const q = query<AccountListQuery>(req);
    res.status(200).json(await accounts.listAccounts(q.kind, q.archived === "true"));
});
export const summary = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await accounts.getSummary());
});
export const activity = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await accounts.getActivity(query<ActivityQuery>(req)));
});
export const detail = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await accounts.getAccountDetail(id(req)));
});
export const create = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await accounts.createAccount(req.body as CreateAccountInput, await actor(req)));
});
export const update = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await accounts.updateAccount(id(req), req.body as UpdateAccountInput, await actor(req)));
});
export const addEntry = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await accounts.addEntry(id(req), req.body as CreateEntryInput, await actor(req)));
});
export const voidEntry = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await accounts.voidEntry(req.params.entryId as string, req.body as VoidEntryInput, await actor(req)));
});
export const remind = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await accounts.sendReminder(id(req), req.body as SendReminderInput, await actor(req)));
});
