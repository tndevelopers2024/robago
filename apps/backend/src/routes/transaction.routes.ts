// src/routes/transaction.routes.ts
import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createTransactionSchema, updateTransactionSchema, UserRole } from "@robago/shared";

const router = Router();
router.use(requireAuth);

router.get("/recent", transactionController.recent);
router.post("/", validateBody(createTransactionSchema), transactionController.create);
router.patch(
    "/:id",
    requireRole(UserRole.Admin),
    validateBody(updateTransactionSchema),
    transactionController.update,
);

export default router;
