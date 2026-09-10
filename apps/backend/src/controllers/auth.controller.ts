// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../utils/cookies.js";
import * as authService from "../services/auth.service.js";
import type { LoginInput } from "@robago/shared";

export const login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const { user, accessToken, refreshToken } = await authService.login(input);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.status(200).json({ user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    if (!token) throw ApiError.unauthorized("No refresh token");
    const { accessToken } = await authService.refresh(token);
    res.status(200).json({ accessToken });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.getMe(req.user.id);
    res.status(200).json(user);
});
