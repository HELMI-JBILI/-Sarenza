import { useTranslation } from "react-i18next";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import PromoCarousel from "@/components/PromoCarousel";
import {
  useBestSellers,
  useCategories,
  useFeaturedProducts,
  useFlashOffers,
  useLatestProducts,
} from "@/lib/queries";

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          {eyebrow && <p className="label-eyebrow mb-2 text-accent">{eyebrow}</p>}
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products, isLoading }: { products?: { id: string }[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!products?.length) {
    return <p className="py-10 text-center text-sm text-muted">Aucun produit disponible pour le moment.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p: any) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: featured, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: bestSellers, isLoading: bestLoading } = useBestSellers();
  const { data: latest, isLoading: latestLoading } = useLatestProducts();
  const { data: flash, isLoading: flashLoading } = useFlashOffers();

  return (
    <div>
      {/* Promotional carousel — admin-managed, auto-rotating. Takes the place
          of the old static hero banner. */}
      <PromoCarousel />

      {/* Trust bar */}
      <section className="border-b border-border bg-white">
        <div className="container-page grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, text: t("product.delivery_info") },
            { icon: RotateCcw, text: "30 days to change your mind" },
            { icon: ShieldCheck, text: "Secure checkout, always" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <item.icon size={22} className="text-primary" />
              <span className="text-sm text-ink">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <Section title={t("home.featured_categories")} eyebrow="Sarenza">
        {catsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4] rounded-xl2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-5">
            {categories?.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("home.featured_products")} eyebrow="Curated">
        <ProductGrid products={featured} isLoading={featuredLoading} />
      </Section>

      {!!flash?.length && (
        <section className="bg-beige py-14 sm:py-20">
          <div className="container-page">
            <p className="label-eyebrow mb-2 text-danger">{t("home.flash_offers")}</p>
            <h2 className="mb-8 font-display text-2xl font-semibold text-ink sm:text-3xl">
              {t("home.flash_offers")}
            </h2>
            <ProductGrid products={flash} isLoading={flashLoading} />
          </div>
        </section>
      )}

      <Section title={t("home.best_sellers")} eyebrow="Popular">
        <ProductGrid products={bestSellers} isLoading={bestLoading} />
      </Section>

      <Section title={t("home.latest_products")} eyebrow="New">
        <ProductGrid products={latest} isLoading={latestLoading} />
      </Section>

      <section className="bg-brand-gradient py-16">
        <div className="container-page flex flex-col items-center gap-5 text-center text-white">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("home.newsletter_title")}</h2>
          <p className="max-w-md text-white/80">{t("home.newsletter_subtitle")}</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md overflow-hidden rounded-full bg-white p-1"
          >
            <input
              type="email"
              placeholder={t("home.newsletter_placeholder") ?? ""}
              className="w-full bg-transparent px-4 text-sm text-ink outline-none"
            />
            <button className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
              {t("home.newsletter_cta")}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
