// src/routes/taggedEntity.routes.ts
import { Router } from "express";
import type { ZodType } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createTaggedEntityController } from "../controllers/taggedEntity.controller.js";
import { Permission } from "@robago/shared";

interface TaggedEntityServiceLike<T> {
    list(): Promise<unknown>;
    create(input: T): Promise<unknown>;
    update(id: string, input: Partial<T>): Promise<unknown>;
    remove(id: string): Promise<void>;
}

export function createTaggedEntityRouter<T>(
    service: TaggedEntityServiceLike<T>,
    createSchema: ZodType<T>,
    updateSchema: ZodType<Partial<T>>,
) {
    const router = Router();
    const controller = createTaggedEntityController(service);
    router.use(requireAuth);

    router.get("/", controller.list);
    router.post("/", requirePermission(Permission.CatalogManage), validateBody(createSchema), controller.create);
    router.patch("/:id", requirePermission(Permission.CatalogManage), validateBody(updateSchema), controller.update);
    router.delete("/:id", requirePermission(Permission.CatalogDelete), controller.remove);

    return router;
}
