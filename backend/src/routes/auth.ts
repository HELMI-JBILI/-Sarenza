import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { requireAdmin, AuthedRequest } from "../middleware/requireAdmin";

const router = Router();

// Tight limiter on login to blunt credential-stuffing attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// POST /api/auth/login — the ONLY account type in this system is admin
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    res.json({ data: { token, admin: { id: admin.id, name: admin.name, email: admin.email } } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — verify current session
router.get("/me", requireAdmin, async (req: AuthedRequest, res) => {
  res.json({ data: req.admin });
});

export default router;
