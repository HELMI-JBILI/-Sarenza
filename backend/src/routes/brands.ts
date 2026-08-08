import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    res.json({ data: brands });
  } catch (err) {
    next(err);
  }
});

const brandSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = brandSchema.parse(req.body);
    const brand = await prisma.brand.create({ data });
    res.status(201).json({ data: brand });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
