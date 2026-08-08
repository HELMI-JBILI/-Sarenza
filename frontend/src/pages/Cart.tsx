import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/currency";

export default function Cart() {
  const { t } = useTranslation();
  const { lines, subtotal, shipping, total, increment, decrement, removeItem, clear } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-5 py-24 text-center">
        <ShoppingBag size={48} className="text-border" />
        <h1 className="font-display text-2xl font-semibold">{t("cart.empty")}</h1>
        <Link to="/" className="btn-primary">
          {t("cart.continue_shopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="mb-8 font-display text-3xl font-semibold">{t("cart.title")}</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-border rounded-xl2 border border-border bg-white">
            {lines.map((line) => (
              <li key={line.product.id} className="flex gap-4 p-5">
                <img
                  src={line.product.images[0]}
                  alt={line.product.name}
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="label-eyebrow">{line.product.brand.name}</p>
                      <Link to={`/product/${line.product.slug}`} className="font-medium text-ink hover:text-primary">
                        {line.product.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(line.product.id)}
                      className="text-muted hover:text-danger"
                      aria-label={t("cart.remove") ?? "Remove"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1.5">
                      <button onClick={() => decrement(line.product.id)} aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm">{line.quantity}</span>
                      <button onClick={() => increment(line.product.id)} aria-label="Increase">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatPrice(line.product.price * line.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={clear} className="mt-4 text-sm text-muted hover:text-danger">
            {t("cart.clear_cart")}
          </button>
        </div>

        <aside className="h-fit rounded-xl2 border border-border bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">{t("checkout.order_summary")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>{t("cart.subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t("cart.shipping")}</span>
              <span>{shipping === 0 ? t("cart.shipping_free") : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-ink">
              <span>{t("cart.total")}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            {t("cart.checkout")}
          </Link>
          <Link to="/" className="mt-3 block text-center text-sm text-muted hover:text-primary">
            {t("cart.continue_shopping")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
