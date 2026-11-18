// src/routes/expense.routes.ts
import { Router } from "express";
import * as expenseController from "../controllers/expense.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
    createExpenseItemSchema,
    createExpensesBulkSchema,
    createExpenseSchema,
    expenseMonthQuerySchema,
    expenseRangeQuerySchema,
    updateExpenseItemSchema,
    updateExpenseSchema,
    Permission,
} from "@robago/shared";

const router = Router();

// Company spending is admin-only, like salaries.
router.use(requireAuth, requirePermission(Permission.ExpensesManage));

// Fixed paths first, then "/:id".
router.get("/items", expenseController.listItems);
router.post("/items", validateBody(createExpenseItemSchema), expenseController.createItem);
router.patch("/items/:id", validateBody(updateExpenseItemSchema), expenseController.updateItem);
router.delete("/items/:id", expenseController.removeItem);

router.get("/totals", validateQuery(expenseRangeQuerySchema), expenseController.totals);

router.get("/", validateQuery(expenseMonthQuerySchema), expenseController.list);
router.post("/bulk", validateBody(createExpensesBulkSchema), expenseController.createMany);
router.post("/", validateBody(createExpenseSchema), expenseController.create);
router.patch("/:id", validateBody(updateExpenseSchema), expenseController.update);
router.delete("/:id", expenseController.remove);

export default router;
