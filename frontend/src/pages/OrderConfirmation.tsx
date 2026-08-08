import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface LocationState {
  fullName?: string;
  total?: number;
}

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <CheckCircle2 size={64} className="text-success" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-6 font-display text-3xl font-semibold text-ink sm:text-4xl"
      >
        {t("checkout.success_title")}
      </motion.h1>

      {state.fullName && (
        <p className="mt-2 text-muted">
          {state.fullName}, {t("checkout.success_subtitle").toLowerCase()}:
        </p>
      )}

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-3 rounded-full bg-beige px-6 py-2.5 font-mono text-lg font-semibold tracking-wide text-primary"
      >
        {orderNumber}
      </motion.p>

      {state.total !== undefined && (
        <p className="mt-4 text-sm text-muted">
          {t("cart.total")}: <span className="font-semibold text-ink">{formatPrice(state.total)}</span>
        </p>
      )}

      <Link to="/" className="btn-primary mt-10">
        {t("cart.continue_shopping")}
      </Link>
    </div>
  );
}
