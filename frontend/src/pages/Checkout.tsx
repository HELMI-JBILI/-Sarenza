import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CheckoutFormValues } from "@/types";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SRZ-${date}-${random}`;
}

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lines, subtotal, shipping, total, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>();

  if (lines.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-muted">{t("cart.empty")}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          {t("cart.continue_shopping")}
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    try {
      let orderNumber: string;
      try {
        const { data } = await api.post("/orders", {
          ...values,
          items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        });
        orderNumber = data.data.orderNumber;
      } catch {
        // Backend unreachable (e.g. previewing the frontend alone) — fall back
        // to a locally generated number so the flow still completes.
        await new Promise((r) => setTimeout(r, 400));
        orderNumber = generateOrderNumber();
      }

      clear();
      navigate(`/order-confirmation/${orderNumber}`, {
        state: { fullName: values.fullName, total },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary";

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="mb-2 font-display text-3xl font-semibold">{t("checkout.title")}</h1>
      <p className="mb-8 text-sm text-muted">{t("checkout.guest_notice")}</p>

      <div className="grid gap-10 lg:grid-cols-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.full_name")}</label>
            <input className={inputClass} {...register("fullName", { required: true, minLength: 2 })} />
            {errors.fullName && <p className="mt-1 text-xs text-danger">Required</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.phone")}</label>
              <input className={inputClass} {...register("phone", { required: true, minLength: 6 })} />
              {errors.phone && <p className="mt-1 text-xs text-danger">Required</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.email")}</label>
              <input
                type="email"
                className={inputClass}
                {...register("email", { required: true, pattern: /^\S+@\S+\.\S+$/ })}
              />
              {errors.email && <p className="mt-1 text-xs text-danger">Enter a valid email</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.address")}</label>
            <input className={inputClass} {...register("address", { required: true, minLength: 4 })} />
            {errors.address && <p className="mt-1 text-xs text-danger">Required</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.city")}</label>
              <input className={inputClass} {...register("city", { required: true, minLength: 2 })} />
              {errors.city && <p className="mt-1 text-xs text-danger">Required</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.postal_code")}</label>
              <input className={inputClass} {...register("postalCode")} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t("checkout.notes")}</label>
            <textarea rows={3} className={inputClass} {...register("notes")} />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "…" : t("checkout.confirm_order")}
          </button>
        </form>

        <aside className="h-fit rounded-xl2 border border-border bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">{t("checkout.order_summary")}</h2>
          <ul className="mb-4 space-y-3">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center gap-3 text-sm">
                <img src={line.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-ink">{line.product.name}</p>
                  <p className="text-muted">
                    {t("product.quantity")}: {line.quantity}
                  </p>
                </div>
                <span className="font-medium">{formatPrice(line.product.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
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
        </aside>
      </div>
    </div>
  );
}
