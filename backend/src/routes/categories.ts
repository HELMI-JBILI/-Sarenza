import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET /api/categories — full tree, parents with nested children
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } },
    });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { children: true },
    });
    if (!category) return res.status(404).json({ error: "NOT_FOUND", message: "Category not found." });
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
});

const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  nameFr: z.string().optional(),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/categories — admin only
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
});

// PUT /api/categories/:id — admin only
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id — admin only
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
