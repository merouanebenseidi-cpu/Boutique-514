import "../../globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/CartProvider";
import { CartLink, LangSwitch } from "@/components/HeaderClient";
import { CATEGORIES, DICTS, isLang, LANGS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Boutique 514";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { default: SHOP, template: `%s · ${SHOP}` }, description: DICTS[lang].heroTitle };
}

export const viewport: Viewport = { themeColor: "#0b8043", width: "device-width", initialScale: 1 };

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

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body className="min-h-screen font-sans antialiased">
        <CartProvider>
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <Link href={`/${lang}`} className="text-xl font-extrabold tracking-tight text-brand-700">
                {SHOP}
              </Link>
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
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 hover:border-brand-500 hover:text-brand-700"
                >
                  <span aria-hidden>{c.icon}</span> {c[lang]}
                </Link>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

          <footer className="mt-12 border-t border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-gray-600">
              <p>{t.footer}</p>
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  💬 {t.contactWhatsapp}
                </a>
              )}
              <p>© {new Date().getFullYear()} {SHOP}</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
