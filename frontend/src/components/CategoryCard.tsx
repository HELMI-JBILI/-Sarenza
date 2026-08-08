import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Category } from "@/types";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/category/${category.slug}`}
        className="group relative block aspect-[3/4] overflow-hidden rounded-xl2 shadow-soft transition-shadow duration-300 hover:shadow-lift"
      >
        <img
          src={category.imageUrl}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="label-eyebrow text-white/70">Sarenza</p>
          <h3 className="font-display text-xl font-semibold text-white">{category.name}</h3>
        </div>
      </Link>
    </motion.div>
  );
}
