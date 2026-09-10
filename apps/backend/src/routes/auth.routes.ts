// src/routes/auth.routes.ts
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema } from "@robago/shared";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
