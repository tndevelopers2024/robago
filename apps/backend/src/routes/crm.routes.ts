// src/routes/crm.routes.ts — school visits.
import { Router } from "express";
import * as c from "../controllers/crm.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createSchoolSchema, logVisitSchema, Permission, schoolListQuerySchema, updateSchoolSchema } from "@robago/shared";

const router = Router();
router.use(requireAuth, requirePermission(Permission.CrmManage));

router.get("/schools", validateQuery(schoolListQuerySchema), c.list);
router.post("/schools", validateBody(createSchoolSchema), c.create);
router.get("/schools/:id", c.detail);
router.patch("/schools/:id", validateBody(updateSchoolSchema), c.update);
router.post("/schools/:id/visits", validateBody(logVisitSchema), c.addVisit);

export default router;
