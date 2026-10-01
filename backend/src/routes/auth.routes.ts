import { Router } from "express";
import { login, logout, me, register, updateProfile } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { loginSchema, registerSchema, updateProfileSchema } from "@/validators/auth.validator";

export const authRoutes = Router();
authRoutes.post("/register", validateBody(registerSchema), register);
authRoutes.post("/login", validateBody(loginSchema), login);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.get("/me", requireAuth, me);
authRoutes.patch("/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);
