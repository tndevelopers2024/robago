// src/routes/staff.routes.ts
import { Router } from "express";
import * as staffController from "../controllers/staff.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
    createEmployeeSchema,
    ledgerQuerySchema,
    setAdvancesSchema,
    setAttendanceSchema,
    setPaymentsSchema,
    updateEmployeeSchema,
    Permission,
} from "@robago/shared";

const router = Router();

// Salaries, advances and personal IDs are sensitive: admins only.
router.use(requireAuth, requirePermission(Permission.StaffManage));

router.get("/", staffController.list);
router.post("/", validateBody(createEmployeeSchema), staffController.create);

// Fixed paths must be declared before "/:id".
router.get("/ledger", validateQuery(ledgerQuerySchema), staffController.ledger);
router.put("/advances", validateBody(setAdvancesSchema), staffController.setAdvances);
router.put("/attendance", validateBody(setAttendanceSchema), staffController.setAttendance);
router.put("/payments", validateBody(setPaymentsSchema), staffController.setPayments);

router.patch("/:id", validateBody(updateEmployeeSchema), staffController.update);
router.delete("/:id", staffController.remove);

export default router;
