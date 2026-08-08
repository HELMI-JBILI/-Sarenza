import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/currency";

export default function CartDrawer() {
  const { t } = useTranslation();
  const { lines, isOpen, closeCart, subtotal, shipping, total, increment, decrement, removeItem } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          onClick={closeCart}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute end-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="font-display text-lg font-semibold">{t("cart.title")}</h2>
              <button onClick={closeCart} aria-label="Close cart" className="rounded-full p-2 hover:bg-canvas">
                <X size={20} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag size={40} className="text-border" />
                <p className="text-muted">{t("cart.empty")}</p>
                <button onClick={closeCart} className="btn-secondary">
                  {t("cart.continue_shopping")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  <ul className="flex flex-col gap-5">
                    {lines.map((line) => (
                      <li key={line.product.id} className="flex gap-4">
                        <img
                          src={line.product.images[0]}
                          alt={line.product.name}
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{line.product.name}</p>
                            <button
                              onClick={() => removeItem(line.product.id)}
                              className="text-xs text-muted hover:text-danger"
                            >
                              {t("cart.remove")}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-primary">{formatPrice(line.product.price)}</p>
                          <div className="mt-2 flex w-fit items-center gap-3 rounded-full border border-border px-2 py-1">
                            <button onClick={() => decrement(line.product.id)} aria-label="Decrease quantity">
                              <Minus size={14} />
                            </button>
                            <span className="w-4 text-center text-sm">{line.quantity}</span>
                            <button onClick={() => increment(line.product.id)} aria-label="Increase quantity">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border p-5">
                  <div className="mb-1.5 flex justify-between text-sm text-muted">
                    <span>{t("cart.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="mb-3 flex justify-between text-sm text-muted">
                    <span>{t("cart.shipping")}</span>
                    <span>{shipping === 0 ? t("cart.shipping_free") : formatPrice(shipping)}</span>
                  </div>
                  <div className="mb-4 flex justify-between border-t border-border pt-3 text-base font-semibold text-ink">
                    <span>{t("cart.total")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <Link to="/checkout" onClick={closeCart} className="btn-primary w-full">
                    {t("cart.checkout")}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
