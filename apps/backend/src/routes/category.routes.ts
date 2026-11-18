// src/routes/category.routes.ts
import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createCategorySchema, updateCategorySchema, Permission } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/", categoryController.list);
router.post("/", requirePermission(Permission.CatalogManage), validateBody(createCategorySchema), categoryController.create);
router.patch("/:id", requirePermission(Permission.CatalogManage), validateBody(updateCategorySchema), categoryController.update);
router.delete("/:id", requirePermission(Permission.CatalogDelete), categoryController.remove);

export default router;
