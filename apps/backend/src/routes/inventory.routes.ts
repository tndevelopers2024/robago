// src/routes/inventory.routes.ts
import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import * as transactionController from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createInventorySchema, updateInventorySchema, Permission } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/alerts", inventoryController.alerts); // before "/:id" so "alerts" isn't captured as an id
router.get("/", inventoryController.list);
router.get("/:id", inventoryController.detail);
router.get("/:inventoryId/transactions", transactionController.listForInventory);
router.post("/", requirePermission(Permission.InventoryManage), validateBody(createInventorySchema), inventoryController.create);
router.patch("/:id", requirePermission(Permission.InventoryManage), validateBody(updateInventorySchema), inventoryController.update);
router.post("/:id/image", requirePermission(Permission.InventoryManage), inventoryController.setImage);

export default router;
