import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// GET /api/advertisements — public, active-only, ordered for the homepage carousel
router.get("/", async (_req, res, next) => {
  try {
    const ads = await prisma.advertisement.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    res.json({ data: ads });
  } catch (err) {
    next(err);
  }
});

// GET /api/advertisements/admin — admin only, every ad (active + inactive)
router.get("/admin", requireAdmin, async (_req, res, next) => {
  try {
    const ads = await prisma.advertisement.findMany({ orderBy: { displayOrder: "asc" } });
    res.json({ data: ads });
  } catch (err) {
    next(err);
  }
});

const adSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  link: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// POST /api/advertisements — admin only
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = adSchema.parse(req.body);
    const ad = await prisma.advertisement.create({
      data: { ...data, link: data.link || undefined },
    });
    res.status(201).json({ data: ad });
  } catch (err) {
    next(err);
  }
});

// PUT /api/advertisements/:id — admin only
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = adSchema.partial().parse(req.body);
    const ad = await prisma.advertisement.update({
      where: { id: req.params.id },
      data: { ...data, link: data.link === "" ? null : data.link },
    });
    res.json({ data: ad });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/advertisements/reorder — admin only, bulk display-order update
router.patch("/reorder", requireAdmin, async (req, res, next) => {
  try {
    const { order } = z
      .object({ order: z.array(z.object({ id: z.string(), displayOrder: z.number().int() })) })
      .parse(req.body);

    await prisma.$transaction(
      order.map((item) =>
        prisma.advertisement.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } })
      )
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// DELETE /api/advertisements/:id — admin only
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.advertisement.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
