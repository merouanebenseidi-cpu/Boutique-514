import "../../globals.css";
import type { Metadata, Viewport } from "next";
import { Cairo, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Biosphere } from "@/components/Biosphere";
import { CartProvider } from "@/components/CartProvider";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CartLink, HeaderShadow, LangSwitch } from "@/components/HeaderClient";
import { CATEGORIES, DICTS, isLang, LANGS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-cairo", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-playfair", display: "swap" });

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Boutique 514";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { default: SHOP, template: `%s · ${SHOP}` }, description: DICTS[lang].heroTitle };
}

export const viewport: Viewport = { themeColor: "#082c1f", width: "device-width", initialScale: 1 };

/** Logo : emblème « Biosphère » + « BOUTIQUE 514 » + signature « MONTRÉAL · ALGER ». */
function Logo({ lang, tone = "light" }: { lang: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Link href={`/${lang}`} className="group flex items-center gap-2.5 sm:gap-3" dir="ltr" aria-label={SHOP}>
      <Biosphere variant="icon" className={`size-9 shrink-0 transition duration-500 group-hover:rotate-[8deg] sm:size-11 ${dark ? "text-gold-300" : "text-brand-800"}`} />
      <span className="leading-none">
        <span className={`block font-logo text-lg font-semibold tracking-[0.1em] whitespace-nowrap sm:text-2xl sm:tracking-[0.14em] ${dark ? "text-white" : "text-brand-950"}`}>
          {SHOP.toUpperCase()}
        </span>
        <span className={`mt-1 flex items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.3em] whitespace-nowrap sm:text-[0.6rem] sm:tracking-[0.38em] ${dark ? "text-gold-300" : "text-gold-600"}`}>
          <span className="h-px w-4 bg-current" />
          MONTRÉAL · ALGER
        </span>
      </span>
    </Link>
  );
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = DICTS[lang];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const announce = [...t.announce, ...t.announce];

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${cairo.variable} ${playfair.variable} ${cormorant.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <CartProvider>
          {/* Bandeau d'annonces défilant */}
          <div className="overflow-hidden bg-brand-950 py-2 text-xs font-medium text-gold-200" dir="ltr">
            <div className="flex w-max animate-marquee gap-12 whitespace-nowrap hover:[animation-play-state:paused]">
              {[0, 1].map((k) => (
                <div key={k} className="flex gap-12" aria-hidden={k === 1}>
                  {announce.map((a, i) => (
                    <span key={i} className="flex items-center gap-3" dir={lang === "ar" ? "rtl" : "ltr"}>
                      <span className="text-gold-400">✦</span>
                      {a}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <header
            id="site-header"
            className="sticky top-0 z-30 border-b border-transparent bg-cream/85 backdrop-blur-md transition-shadow data-[scrolled]:border-black/5 data-[scrolled]:shadow-[0_6px_24px_-12px_rgba(8,44,31,0.25)]"
          >
            <HeaderShadow />
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <Logo lang={lang} />
              <div className="flex items-center gap-2">
                <LangSwitch lang={lang} />
                <CartLink lang={lang} label={t.cart} />
              </div>
            </div>
            <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm [scrollbar-width:none]">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${lang}/categorie/${c.slug}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-900/10 bg-white px-3.5 py-1.5 font-medium text-brand-900 transition hover:border-gold-400 hover:bg-gold-100"
                >
                  <CategoryIcon slug={c.slug} className="size-4 text-brand-600" />
                  {c[lang]}
                </Link>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

          <footer className="mt-16 bg-brand-950 text-brand-100">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
              <div className="space-y-3">
                <Logo lang={lang} tone="dark" />
                <p className="text-sm leading-relaxed text-brand-200">{t.footerAbout}</p>
              </div>
              <div>
                <p className="mb-3 text-sm font-bold tracking-wider text-gold-300 uppercase">{t.footerShop}</p>
                <ul className="space-y-2 text-sm">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/${lang}/categorie/${c.slug}`} className="transition hover:text-gold-300">
                        {c[lang]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold tracking-wider text-gold-300 uppercase">{t.footerHelp}</p>
                <p className="text-sm leading-relaxed text-brand-200">{t.howToOrder}</p>
                {wa && (
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-gold">
                    <MessageCircle className="size-4" aria-hidden />
                    {t.contactWhatsapp}
                  </a>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 py-5 text-center text-xs text-brand-300">
              © {new Date().getFullYear()} {SHOP} · {t.footer}
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
