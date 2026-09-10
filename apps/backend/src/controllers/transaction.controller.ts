// src/controllers/transaction.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as transactionService from "../services/transaction.service.js";
import type { CreateTransactionInput, UpdateTransactionInput } from "@robago/shared";

export const listForInventory = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const transactions = await transactionService.listTransactionsForInventory(
        req.params.inventoryId as string,
        limit,
    );
    res.status(200).json(transactions);
});

export const recent = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    res.status(200).json(await transactionService.listRecentTransactions(limit));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const transaction = await transactionService.createTransaction(
        req.body as CreateTransactionInput,
        req.user.phoneNumber,
    );
    res.status(201).json(transaction);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.updateTransaction(
        req.params.id as string,
        req.body as UpdateTransactionInput,
    );
    res.status(200).json(transaction);
});
