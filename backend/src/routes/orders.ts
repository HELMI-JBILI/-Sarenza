import { Router } from "express";
import { z } from "zod";
import { Prisma, Product } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAdmin";
import { ApiError } from "../middleware/errorHandler";

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  variantLabel: z.string().optional(),
});

const createOrderSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  address: z.string().min(4),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SRZ-${date}-${random}`;
}

// POST /api/orders — guest checkout, no account required
router.post("/", async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) } },
    });

    if (products.length !== new Set(body.items.map((i) => i.productId)).size) {
      throw new ApiError(400, "INVALID_ITEMS", "One or more products in the cart no longer exist.");
    }

    for (const item of body.items) {
      const product = products.find((p: Product) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        throw new ApiError(
          409,
          "OUT_OF_STOCK",
          `Not enough stock for ${product.name}. Only ${product.stock} left.`
        );
      }
    }

    const subtotal = body.items.reduce((sum, item) => {
      const product = products.find((p: Product) => p.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const shipping = subtotal >= 100 ? 0 : 5.99;
    const discount = 0; // reserved for future promo-code support
    const total = subtotal + shipping - discount;

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          fullName: body.fullName,
          phone: body.phone,
          email: body.email,
          address: body.address,
          city: body.city,
          postalCode: body.postalCode,
          notes: body.notes,
          subtotal,
          discount,
          shipping,
          total,
          items: {
            create: body.items.map((item) => {
              const product = products.find((p: Product) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
                variantLabel: item.variantLabel,
              };
            }),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:orderNumber — order lookup for the confirmation page
router.get("/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    });
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — admin only, full order list
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const orders = await prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — admin only
router.patch("/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { status } = z
      .object({
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
      })
      .parse(req.body);
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/orders/:id — admin only, and only for DELIVERED orders.
// OrderItems cascade-delete automatically (see schema); products/customers are untouched.
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });

    if (order.status !== "DELIVERED") {
      throw new ApiError(
        409,
        "INVALID_STATUS",
        "Only delivered orders can be deleted. Update the order status to DELIVERED first."
      );
    }

    await prisma.order.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
