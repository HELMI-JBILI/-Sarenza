import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/twoTwins2?mibextid=rS40aB7S9Ucbxw6v", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/sarenzaa1?igsh=cGVydWVldXA4b3R6", Icon: Instagram },
];

const CONTACT = {
  email: "Sarenzashoptn@gmail.com",
  phones: ["+216 92 752 306", "+216 92 752 308"],
};

// lucide-react has no TikTok glyph (brand marks are excluded from the icon set),
// so this mirrors the other social icons' 16px/stroke treatment by hand.
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.68V9.4a5.8 5.8 0 1 0 5 5.75V8.3a7.2 7.2 0 0 0 4.5 1.6V6.9a4.2 4.2 0 0 1-4.5-4.4V2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-24 border-t border-border bg-canvas">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo.jpeg" alt="Sarenza" className="h-14 w-auto object-contain" />
          <p className="mt-3 text-sm text-muted">
            {t("home.hero_subtitle")}
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
            <a
              href="https://www.tiktok.com/@sarenza.tn?_r=1&_t=ZS-98YQVy6zX7a"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4">{t("footer.about")}</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><a href="#" className="hover:text-primary">{t("footer.about")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.faq")}</a></li>
          </ul>

          <h4 className="label-eyebrow mb-3 mt-6">{t("footer.contact")}</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail size={14} className="shrink-0" />
                <span className="break-all">{CONTACT.email}</span>
              </a>
            </li>
            {CONTACT.phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone size={14} className="shrink-0" />
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4">{t("footer.terms")}</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><a href="#" className="hover:text-primary">{t("footer.privacy")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.terms")}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="label-eyebrow mb-4">{t("footer.newsletter")}</h4>
          <p className="mb-3 text-sm text-muted">{t("home.newsletter_subtitle")}</p>
          <form className="flex overflow-hidden rounded-full border border-border" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder={t("home.newsletter_placeholder") ?? ""}
              className="w-full bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <button className="shrink-0 bg-primary px-4 text-sm font-semibold text-white">{t("home.newsletter_cta")}</button>
          </form>
        </div>
      </div>

      <div className="bg-brand-gradient py-6">
        <div className="container-page flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold tracking-tight text-white">designed by nexora</p>
          <p className="text-xs font-light text-white/60">helmi jbili &amp; neder amri</p>
        </div>
      </div>
    </footer>
  );
}
