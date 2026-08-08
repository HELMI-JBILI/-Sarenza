import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { normalizeCategory, normalizeBrand, normalizeProduct, normalizeAdvertisement } from "@/lib/normalize";

// Every hook here calls the real backend. There is no mock/demo data
// fallback — if the API is unreachable or the database is empty, the UI is
// responsible for showing an honest loading/error/empty state (see the
// `isLoading` / `isError` / empty-array checks in the pages that consume
// these hooks).

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return (data.data as any[]).map(normalizeCategory);
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await api.get("/brands");
      return (data.data as any[]).map(normalizeBrand);
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await api.get("/products/featured");
      return (data.data as any[]).map(normalizeProduct);
    },
  });
}

export function useBestSellers() {
  return useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: async () => {
      const { data } = await api.get("/products", { params: { sort: "best_selling", pageSize: 8 } });
      return (data.data as any[]).map(normalizeProduct);
    },
  });
}

export function useLatestProducts() {
  return useQuery({
    queryKey: ["products", "latest"],
    queryFn: async () => {
      const { data } = await api.get("/products", { params: { sort: "newest", pageSize: 8 } });
      return (data.data as any[]).map(normalizeProduct);
    },
  });
}

export function useFlashOffers() {
  return useQuery({
    queryKey: ["products", "flash-offers"],
    queryFn: async () => {
      const { data } = await api.get("/products/flash-offers");
      return (data.data as any[]).map(normalizeProduct);
    },
  });
}

export interface ProductFilters {
  categorySlug?: string; // main category OR subcategory slug
  subcategorySlug?: string; // explicit subcategory slug
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "best_selling";
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get("/products", {
        params: {
          category: filters.categorySlug,
          subcategory: filters.subcategorySlug,
          brand: filters.brandSlugs?.[0], // backend filters one brand per call; widened client-side below
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          onSale: filters.onSale,
          inStock: filters.inStock,
          search: filters.search,
          sort: filters.sort,
          pageSize: 60,
        },
      });
      let list = (data.data as any[]).map(normalizeProduct);
      if (filters.brandSlugs && filters.brandSlugs.length > 1) {
        list = list.filter((p) => filters.brandSlugs!.includes(p.brand.slug));
      }
      return list;
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return normalizeProduct(data.data);
    },
    enabled: !!slug,
  });
}

export function useRelatedProducts(product: { id: string; slug: string } | null | undefined) {
  return useQuery({
    queryKey: ["products", "related", product?.id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${product!.slug}`);
      return ((data.data.related ?? []) as any[]).map(normalizeProduct);
    },
    enabled: !!product,
  });
}

export function useAdvertisements() {
  return useQuery({
    queryKey: ["advertisements"],
    queryFn: async () => {
      const { data } = await api.get("/advertisements");
      return (data.data as any[]).map(normalizeAdvertisement);
    },
  });
}
