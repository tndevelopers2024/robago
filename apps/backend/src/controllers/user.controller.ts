// src/controllers/user.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";
import type { CreateUserInput, UpdateUserInput } from "@robago/shared";

export const list = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await userService.listUsers());
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body as CreateUserInput);
    res.status(201).json(user);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(
        req.params.phoneNumber as string,
        req.body as UpdateUserInput,
    );
    res.status(200).json(user);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.phoneNumber as string);
    res.status(204).send();
});
