// src/routes/transaction.routes.ts
import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createTransactionSchema, updateTransactionSchema, Permission } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/recent", transactionController.recent);
router.post("/", requirePermission(Permission.TransactionsRecord), validateBody(createTransactionSchema), transactionController.create);
router.patch(
    "/:id",
    requirePermission(Permission.TransactionsEdit),
    validateBody(updateTransactionSchema),
    transactionController.update,
);

export default router;
