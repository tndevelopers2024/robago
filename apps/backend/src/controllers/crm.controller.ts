// src/controllers/crm.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as crm from "../services/crm.service.js";
import type { CreateSchoolInput, LogVisitInput, SchoolListQuery, UpdateSchoolInput } from "@robago/shared";

const id = (req: Request) => req.params.id as string;
const actor = (req: Request) => crm.resolveActor(req.user);

export const list = asyncHandler(async (req: Request, res: Response) => {
    const q = (req as Request & { validatedQuery: SchoolListQuery }).validatedQuery;
    res.status(200).json(await crm.listSchools(q.archived === "true"));
});
export const detail = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await crm.getSchoolDetail(id(req)));
});
export const create = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await crm.createSchool(req.body as CreateSchoolInput, await actor(req)));
});
export const update = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await crm.updateSchool(id(req), req.body as UpdateSchoolInput, await actor(req)));
});
export const addVisit = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await crm.logVisit(id(req), req.body as LogVisitInput, await actor(req)));
});
