import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Heart, Menu, X, Phone, Globe } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCategories } from "@/lib/queries";
import CategoryAccordion from "@/components/CategoryAccordion";

const LANGUAGES: { code: "fr" | "en" | "ar"; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { itemCount, openCart } = useCart();
  const { data: categories } = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/category/all?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ease-editorial ${
        scrolled ? "border-border bg-canvas/95 shadow-soft backdrop-blur-md" : "border-transparent bg-canvas/80 backdrop-blur-sm"
      }`}
    >
      <div className="h-1 bg-accent" />
      <div className="container-page flex h-20 items-center justify-between gap-6">
        {/* Mobile hamburger — opens the left-side category drawer */}
        <button
          className="rounded-full p-2.5 text-ink transition-colors hover:bg-canvas lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
        >
          <Menu size={22} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src="/logo.jpeg" alt="Sarenza" className="h-12 w-auto object-contain" />
        </Link>

        {/* Search — desktop */}
        <form onSubmit={submitSearch} className="hidden flex-1 max-w-xl items-center lg:flex">
          <div className="flex w-full items-center rounded-full border border-border bg-canvas px-4 py-2.5 transition-colors focus-within:border-primary">
            <Search size={18} className="text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.search_placeholder") ?? ""}
              className="w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a
            href="tel:+21692752306"
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-primary md:flex"
          >
            <Phone size={17} />
            {t("nav.contact")}
          </a>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full p-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              aria-label="Language"
            >
              <Globe size={19} />
              <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute end-0 mt-2 w-32 overflow-hidden rounded-xl border border-border bg-white shadow-card"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        i18n.changeLanguage(l.code);
                        setLangOpen(false);
                      }}
                      className={`block w-full px-4 py-2.5 text-start text-sm hover:bg-canvas ${
                        i18n.language === l.code ? "font-semibold text-primary" : "text-ink"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="hidden rounded-full p-2.5 text-ink transition-colors hover:bg-canvas sm:flex"
            aria-label={t("nav.wishlist") ?? "Wishlist"}
          >
            <Heart size={20} />
          </button>

          <button
            onClick={openCart}
            className="relative rounded-full p-2.5 text-ink transition-colors hover:bg-canvas"
            aria-label={t("nav.cart") ?? "Cart"}
          >
            <ShoppingBag size={20} />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -end-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Category strip — desktop, typography only, no icons */}
      <nav className="hidden border-t border-border/70 bg-primary-50 lg:block" aria-label="Catégories">
        <div className="container-page flex h-12 items-center gap-8">
          {categories?.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile category drawer — opens from the left, accordion with subcategories */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute start-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto overflow-x-hidden bg-white p-6 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <img src="/logo.jpeg" alt="Sarenza" className="h-10 w-auto object-contain" />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="rounded-full p-1.5 text-muted hover:bg-canvas hover:text-ink"
                >
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={submitSearch} className="mb-6 flex items-center rounded-full border border-border px-4 py-2.5">
                <Search size={18} className="text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("nav.search_placeholder") ?? ""}
                  className="w-full bg-transparent px-3 text-sm outline-none"
                />
              </form>
              <CategoryAccordion categories={categories ?? []} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
