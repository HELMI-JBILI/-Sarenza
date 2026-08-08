import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdvertisements } from "@/lib/queries";

const AUTO_ADVANCE_MS = 6000;

export default function PromoCarousel() {
  const { data: ads, isLoading } = useAdvertisements();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = ads?.length ?? 0;

  const goTo = useCallback((i: number) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [next, paused, count]);

  // No fabricated placeholder banners — if there are no active ads yet, the
  // section simply doesn't render.
  if (isLoading || count === 0) return null;

  const ad = ads![index];

  const Slide = (
    <motion.div
      key={ad.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0"
    >
      <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">{ad.title}</h2>
        {ad.description && <p className="mt-1.5 max-w-lg text-sm text-white/85 sm:text-base">{ad.description}</p>}
      </div>
    </motion.div>
  );

  return (
    <section
      className="container-page pt-6 sm:pt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[220px] overflow-hidden rounded-xl2 shadow-soft sm:h-[320px] lg:h-[400px]">
        {ad.link ? (
          <a href={ad.link} className="absolute inset-0" aria-label={ad.title}>
            <AnimatePresence mode="wait">{Slide}</AnimatePresence>
          </a>
        ) : (
          <AnimatePresence mode="wait">{Slide}</AnimatePresence>
        )}

        {count > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Bannière précédente"
              className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow-soft backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Bannière suivante"
              className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow-soft backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
              {ads!.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => goTo(i)}
                  aria-label={`Aller à la bannière ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
