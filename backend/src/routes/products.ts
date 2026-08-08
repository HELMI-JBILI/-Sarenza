import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

const querySchema = z.object({
  category: z.string().optional(), // accepts a main-category OR subcategory slug
  subcategory: z.string().optional(), // explicit subcategory slug, always exact-match
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "best_selling", "rating"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

// Resolves a category filter into a Prisma condition. If the slug belongs to
// a main category (no parent), match any product whose subcategory rolls up
// to it (or, rarely, is assigned directly to the main category). If it's
// already a subcategory (leaf), match it exactly.
async function resolveCategoryWhere(
  categorySlug?: string,
  subcategorySlug?: string
): Promise<Prisma.ProductWhereInput> {
  if (subcategorySlug) {
    const sub = await prisma.category.findUnique({ where: { slug: subcategorySlug } });
    return sub ? { categoryId: sub.id } : { categoryId: "__none__" };
  }
  if (!categorySlug) return {};

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: { children: true },
  });
  if (!category) return { categoryId: "__none__" };

  if (category.children.length > 0) {
    // Main category: include every product in its subcategories, plus any
    // legacy product assigned directly to the main category itself.
    const ids = [category.id, ...category.children.map((c: { id: string }) => c.id)];
    return { categoryId: { in: ids } };
  }
  return { categoryId: category.id };
}

// GET /api/products — filterable, sortable, paginated catalog
router.get("/", async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);
    const categoryWhere = await resolveCategoryWhere(q.category, q.subcategory);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...categoryWhere,
      ...(q.brand ? { brand: { slug: q.brand } } : {}),
      ...(q.inStock ? { stock: { gt: 0 } } : {}),
      ...(q.onSale ? { compareAtPrice: { not: null } } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" } },
              { description: { contains: q.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(q.minPrice !== undefined || q.maxPrice !== undefined
        ? {
            price: {
              ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
              ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === "price_asc"
        ? { price: "asc" }
        : q.sort === "price_desc"
        ? { price: "desc" }
        : q.sort === "rating"
        ? { rating: "desc" }
        : q.sort === "best_selling"
        ? { reviewCount: "desc" } // proxy for sales volume until an orders aggregate view exists
        : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, brand: true, category: { include: { parent: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: items,
      meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
router.get("/featured", async (_req, res, next) => {
  try {
    const items = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 12,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, brand: true, category: { include: { parent: true } } },
    });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/flash-offers
router.get("/flash-offers", async (_req, res, next) => {
  try {
    const items = await prisma.product.findMany({
      where: { isActive: true, isFlashOffer: true },
      take: 12,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, brand: true, category: { include: { parent: true } } },
    });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — full detail + related products
router.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        brand: true,
        category: { include: { parent: true } },
      },
    });
    if (!product) return res.status(404).json({ error: "NOT_FOUND", message: "Product not found." });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 8,
      include: { images: { take: 1 }, category: { include: { parent: true } } },
    });

    res.json({ data: { ...product, related } });
  } catch (err) {
    next(err);
  }
});

const productImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  altText: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  nameFr: z.string().optional(),
  nameAr: z.string().optional(),
  description: z.string().min(1),
  descriptionFr: z.string().optional(),
  descriptionAr: z.string().optional(),
  sku: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isFlashOffer: z.boolean().optional(),
  specifications: z.record(z.string()).optional(),
  warrantyMonths: z.number().int().optional(),
  images: z.array(productImageSchema).optional(),
});

// POST /api/products — admin only
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { images, ...rest } = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...rest,
        images: images?.length
          ? { create: images.map((img, i) => ({ ...img, sortOrder: img.sortOrder ?? i })) }
          : undefined,
      },
      include: { images: true },
    });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — admin only
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { images, ...rest } = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        // Replacing the full image set is simplest and safe for the admin's
        // single-form editing flow (vs. diffing individual images).
        images: images
          ? { deleteMany: {}, create: images.map((img, i) => ({ ...img, sortOrder: img.sortOrder ?? i })) }
          : undefined,
      },
      include: { images: true },
    });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — admin only
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
