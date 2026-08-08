import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Category } from "@/types";

interface CategoryAccordionProps {
  categories: Category[];
  onNavigate?: () => void;
  activeMainSlug?: string;
  activeSubSlug?: string;
}

export default function CategoryAccordion({
  categories,
  onNavigate,
  activeMainSlug,
  activeSubSlug,
}: CategoryAccordionProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(() => (activeMainSlug ? new Set([activeMainSlug]) : new Set()));

  const toggle = (slug: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  const goToMain = (slug: string) => {
    navigate(`/category/${slug}`);
    onNavigate?.();
  };

  const goToSub = (mainSlug: string, subSlug: string) => {
    navigate(`/category/${mainSlug}?sub=${subSlug}`);
    onNavigate?.();
  };

  return (
    <nav aria-label="Catégories">
      <ul className="divide-y divide-border">
        {categories.map((cat) => {
          const isExpanded = expanded.has(cat.slug);
          const isActiveMain = activeMainSlug === cat.slug;
          return (
            <li key={cat.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToMain(cat.slug)}
                  className={`flex-1 py-3 text-start text-sm font-medium transition-colors ${
                    isActiveMain ? "text-primary" : "text-ink hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
                {!!cat.children?.length && (
                  <button
                    type="button"
                    onClick={() => toggle(cat.slug)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Réduire ${cat.name}` : `Développer ${cat.name}`}
                    className="p-2 text-muted transition-colors hover:text-primary"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {!!cat.children?.length && (
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.ul
                      key="submenu"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="ms-3 space-y-0.5 overflow-hidden border-s border-border ps-3"
                    >
                      {cat.children.map((sub) => {
                        const isActiveSub = isActiveMain && activeSubSlug === sub.slug;
                        return (
                          <li key={sub.id} className="py-0.5 first:pt-2 last:pb-2">
                            <button
                              type="button"
                              onClick={() => goToSub(cat.slug, sub.slug)}
                              className={`block w-full py-1.5 text-start text-sm transition-colors ${
                                isActiveSub ? "font-medium text-primary" : "text-muted hover:text-primary"
                              }`}
                            >
                              {sub.name}
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
