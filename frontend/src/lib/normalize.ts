import { Brand, Category, Product, Advertisement } from "@/types";

// Prisma serializes Decimal fields as strings over JSON — these helpers
// normalize the raw API payloads into the shapes the UI components expect.

export function normalizeCategory(raw: any): Category {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? undefined,
    imageUrl: raw.imageUrl || `https://placehold.co/900x1100/163B7A/FFFFFF?text=${encodeURIComponent(raw.name)}`,
    parentSlug: raw.parent?.slug ?? undefined,
    children: raw.children ? raw.children.map(normalizeCategory) : undefined,
  };
}

export function normalizeBrand(raw: any): Brand {
  return { id: raw.id, slug: raw.slug, name: raw.name };
}

export function normalizeProduct(raw: any): Product {
  const images = (raw.images ?? []).map((img: any) => (typeof img === "string" ? img : img.url));
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    price: Number(raw.price),
    compareAtPrice: raw.compareAtPrice != null ? Number(raw.compareAtPrice) : undefined,
    currency: raw.currency ?? "TND",
    stock: raw.stock,
    rating: Number(raw.rating ?? 0),
    reviewCount: raw.reviewCount ?? 0,
    images: images.length
      ? images
      : [`https://placehold.co/900x1100/163B7A/FFFFFF?text=${encodeURIComponent(raw.name)}`],
    categorySlug: raw.category?.slug ?? raw.categorySlug ?? "",
    categoryName: raw.category?.name ?? raw.categoryName ?? "",
    mainCategorySlug: raw.category?.parent?.slug ?? raw.mainCategorySlug ?? undefined,
    mainCategoryName: raw.category?.parent?.name ?? raw.mainCategoryName ?? undefined,
    brand: raw.brand ? normalizeBrand(raw.brand) : { id: "unbranded", slug: "unbranded", name: "Sarenza" },
    isFlashOffer: raw.isFlashOffer ?? false,
    specifications: raw.specifications ?? undefined,
    warrantyMonths: raw.warrantyMonths ?? undefined,
  };
}

export function normalizeAdvertisement(raw: any): Advertisement {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    imageUrl: raw.imageUrl,
    link: raw.link ?? undefined,
    isActive: raw.isActive,
    displayOrder: raw.displayOrder,
  };
}
