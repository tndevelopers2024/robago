// src/routes/user.routes.ts
import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema, UserRole } from "@robago/shared";

const router = Router();
router.use(requireAuth, requireRole(UserRole.Admin));

router.get("/", userController.list);
router.post("/", validateBody(createUserSchema), userController.create);
router.patch("/:phoneNumber", validateBody(updateUserSchema), userController.update);
router.delete("/:phoneNumber", userController.remove);

export default router;
