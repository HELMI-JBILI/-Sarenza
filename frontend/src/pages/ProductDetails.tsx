import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Minus, Plus, Share2, ShieldCheck, Truck } from "lucide-react";
import { useProduct, useRelatedProducts } from "@/lib/queries";
import { useCart } from "@/context/CartContext";
import StarRating from "@/components/StarRating";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { formatPrice } from "@/lib/currency";

const RECENTLY_VIEWED_KEY = "sarenza_recently_viewed";

export default function ProductDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug);
  const { data: related, isLoading: relatedLoading } = useRelatedProducts(product);
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQuantity(1);
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 6);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-xl2" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-muted">Product not found.</p>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : null;

  const stockLabel =
    product.stock === 0
      ? t("product.availability_out")
      : product.stock <= 10
      ? t("product.availability_low_stock")
      : t("product.availability_in_stock");

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImage}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="group relative aspect-square overflow-hidden rounded-xl2 bg-beige"
          >
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-110"
            />
            {discount && (
              <span className="absolute start-4 top-4 rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
          </motion.div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                    activeImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="label-eyebrow text-accent">{product.brand.name}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-primary">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>

          <p
            className={`mt-2 text-sm font-medium ${
              product.stock === 0 ? "text-danger" : product.stock <= 10 ? "text-warning" : "text-success"
            }`}
          >
            {stockLabel}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-4 rounded-full border border-border px-4 py-2.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease">
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} aria-label="Increase">
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => addItem(product, quantity)}
              disabled={product.stock === 0}
              className="btn-primary flex-1"
            >
              {t("product.add_to_cart")}
            </button>
          </div>
          <button
            onClick={() => {
              addItem(product, quantity);
              navigate("/checkout");
            }}
            disabled={product.stock === 0}
            className="btn-secondary mt-3 w-full"
          >
            {t("product.buy_now")}
          </button>

          <div className="mt-8 grid gap-3 rounded-xl2 border border-border bg-canvas p-4 text-sm text-muted sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              {t("product.delivery_info")}
            </div>
            {product.warrantyMonths && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                {product.warrantyMonths} {t("product.warranty")}
              </div>
            )}
          </div>

          {product.specifications && (
            <div className="mt-8">
              <h3 className="label-eyebrow mb-3">{t("product.specifications")}</h3>
              <dl className="divide-y divide-border rounded-xl2 border border-border">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-3 text-sm">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <button className="mt-6 flex items-center gap-2 text-sm text-muted hover:text-primary">
            <Share2 size={16} />
            {t("product.share")}
          </button>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="mb-6 font-display text-2xl font-semibold text-ink">{t("product.related_products")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {relatedLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : related?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
