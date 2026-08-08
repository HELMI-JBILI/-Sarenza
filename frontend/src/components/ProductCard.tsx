import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Eye, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import StarRating from "@/components/StarRating";
import { formatPrice } from "@/lib/currency";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const discount = product.compareAtPrice
    ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group card-surface overflow-hidden hover:shadow-lift"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-beige">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.06]"
            loading="lazy"
          />
          {discount && (
            <span className="absolute start-3 top-3 rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">
              -{discount}%
            </span>
          )}

          {/* Quick actions — reveal on hover, editorial-label style */}
          <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 ease-editorial group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                addItem(product, 1);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-primary-700"
            >
              <ShoppingBag size={14} />
              {t("product.add_to_cart")}
            </button>
            <span className="flex items-center justify-center rounded-full bg-white p-2.5 text-ink shadow-soft" aria-label={t("product.quick_view") ?? ""}>
              <Eye size={16} />
            </span>
          </div>
        </div>

        <div className="p-4">
          <p className="label-eyebrow">{product.brand.name}</p>
          <h3 className="mt-1 truncate font-display text-base font-medium text-ink">{product.name}</h3>
          <div className="mt-1.5">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-semibold text-primary">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
