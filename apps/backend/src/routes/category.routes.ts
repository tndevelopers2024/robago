// src/routes/category.routes.ts
import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createCategorySchema, updateCategorySchema, UserRole } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/", categoryController.list);
router.post("/", requireRole(UserRole.Admin), validateBody(createCategorySchema), categoryController.create);
router.patch("/:id", requireRole(UserRole.Admin), validateBody(updateCategorySchema), categoryController.update);
router.delete("/:id", requireRole(UserRole.Admin), categoryController.remove);

export default router;
