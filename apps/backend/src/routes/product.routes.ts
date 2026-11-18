// src/routes/product.routes.ts
import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema, Permission } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/", productController.list);
router.post("/", requirePermission(Permission.CatalogManage), validateBody(createProductSchema), productController.create);
router.patch("/:id", requirePermission(Permission.CatalogManage), validateBody(updateProductSchema), productController.update);
router.delete("/:id", requirePermission(Permission.CatalogDelete), productController.remove);

export default router;
