/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep blue stays one of the dominant colors (buttons, links, active
        // states); gold is a deliberately sparing accent (icons, borders,
        // small highlights) — not the dominant hue.
        primary: { DEFAULT: "#163B7A", 50: "#EAF0FA", 600: "#163B7A", 700: "#0F2B5C" },
        royal: { DEFAULT: "#2F5AA8" }, // lighter blue, used only to vary admin status badges
        accent: { DEFAULT: "#C9A227" }, // gold — ratings, eyebrow labels, small premium details
        beige: { DEFAULT: "#F3E9D2" }, // warm cream — alternating sections, image placeholders
        surface: { DEFAULT: "#FFFFFF" }, // cards/content surfaces — white used for readability, not dominance
        canvas: { DEFAULT: "#FBF6EA" }, // warm cream — dominant page background (not white)
        border: { DEFAULT: "#E6DCC0" }, // warm cream-tinted border/divider
        ink: { DEFAULT: "#1E293B" }, // dark neutral for readable body text
        muted: { DEFAULT: "#64748B" },
        success: { DEFAULT: "#10B981" },
        warning: { DEFAULT: "#F59E0B" },
        danger: { DEFAULT: "#EF4444" },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.16em",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 20px -6px rgba(22, 59, 122, 0.14)",
        card: "0 8px 30px -10px rgba(22, 59, 122, 0.20)",
        lift: "0 20px 45px -18px rgba(22, 59, 122, 0.28)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
