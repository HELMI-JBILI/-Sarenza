import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import CategoryAccordion from "@/components/CategoryAccordion";
import { useCategories, useProducts, ProductFilters } from "@/lib/queries";

export default function Category() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") ?? undefined;
  const subParam = searchParams.get("sub") ?? undefined;

  const { data: categories } = useCategories();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const filters: ProductFilters = useMemo(
    () => ({
      categorySlug: slug && slug !== "all" ? slug : undefined,
      subcategorySlug: subParam,
      search,
    }),
    [slug, subParam, search]
  );

  const { data: products, isLoading } = useProducts(filters);

  // Resolve the page heading: could be a main category, or (main + selected subcategory).
  const currentMain = categories?.find((c) => c.slug === slug);
  const currentSub = currentMain?.children?.find((c) => c.slug === subParam);
  const heading = search ? `"${search}"` : currentSub?.name ?? currentMain?.name ?? t("nav.categories");

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8">
        {currentMain && currentSub && (
          <p className="label-eyebrow mb-1 text-muted">{currentMain.name}</p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink">{heading}</h1>
      </div>

      <div className="flex gap-10">
        {/* Category navigation — desktop, left side. This page browses purely by
            category/subcategory; there is intentionally no price/brand/sort filter UI. */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <h2 className="label-eyebrow mb-3">{t("filters.categories")}</h2>
          <CategoryAccordion categories={categories ?? []} activeMainSlug={slug} activeSubSlug={subParam} />
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium lg:hidden"
              aria-label={t("filters.categories") ?? "Categories"}
            >
              <Menu size={16} />
              {t("filters.categories")}
            </button>
            <span className="text-sm text-muted">
              {products?.length ?? 0} {t("nav.categories")}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products?.length ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-muted">Aucun produit dans cette catégorie pour le moment.</p>
          )}
        </div>
      </div>

      {/* Mobile category navigation drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <div
            className="absolute start-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto overflow-x-hidden bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{t("filters.categories")}</h2>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Fermer">
                <X size={22} />
              </button>
            </div>
            <CategoryAccordion
              categories={categories ?? []}
              activeMainSlug={slug}
              activeSubSlug={subParam}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
