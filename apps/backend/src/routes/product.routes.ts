// src/routes/product.routes.ts
import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema, UserRole } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/", productController.list);
router.post("/", requireRole(UserRole.Admin), validateBody(createProductSchema), productController.create);
router.patch("/:id", requireRole(UserRole.Admin), validateBody(updateProductSchema), productController.update);
router.delete("/:id", requireRole(UserRole.Admin), productController.remove);

export default router;
