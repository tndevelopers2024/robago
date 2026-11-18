// src/routes/accounts.routes.ts
import { Router } from "express";
import * as c from "../controllers/accounts.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
    accountListQuerySchema,
    activityQuerySchema,
    createAccountSchema,
    createEntrySchema,
    sendReminderSchema,
    Permission,
    updateAccountSchema,
    voidEntrySchema,
} from "@robago/shared";

const router = Router();

// Money owed and owing is for super admins only.
router.use(requireAuth, requirePermission(Permission.AccountsManage));

// Fixed paths before "/:id".
router.get("/summary", c.summary);
router.get("/activity", validateQuery(activityQuerySchema), c.activity);
router.post("/entries/:entryId/void", validateBody(voidEntrySchema), c.voidEntry);

router.get("/", validateQuery(accountListQuerySchema), c.list);
router.post("/", validateBody(createAccountSchema), c.create);
router.get("/:id", c.detail);
router.patch("/:id", validateBody(updateAccountSchema), c.update);
router.post("/:id/entries", validateBody(createEntrySchema), c.addEntry);
router.post("/:id/reminders", validateBody(sendReminderSchema), c.remind);

export default router;
