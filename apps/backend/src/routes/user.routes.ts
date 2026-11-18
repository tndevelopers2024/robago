// src/routes/user.routes.ts
import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema, Permission } from "@robago/shared";

const router = Router();
router.use(requireAuth, requirePermission(Permission.UsersManage));

router.get("/", userController.list);
router.post("/", validateBody(createUserSchema), userController.create);
router.patch("/:phoneNumber", validateBody(updateUserSchema), userController.update);
router.delete("/:phoneNumber", userController.remove);

export default router;
