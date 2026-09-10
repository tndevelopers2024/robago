// src/routes/inventory.routes.ts
import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import * as transactionController from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createInventorySchema, updateInventorySchema, UserRole } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/alerts", inventoryController.alerts); // before "/:id" so "alerts" isn't captured as an id
router.get("/", inventoryController.list);
router.get("/:id", inventoryController.detail);
router.get("/:inventoryId/transactions", transactionController.listForInventory);
router.post("/", requireRole(UserRole.Admin), validateBody(createInventorySchema), inventoryController.create);
router.patch("/:id", requireRole(UserRole.Admin), validateBody(updateInventorySchema), inventoryController.update);
router.post("/:id/image", requireRole(UserRole.Admin), inventoryController.setImage);

export default router;
