import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";
import { ProductGrid, productName, SectionTitle } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { TrustStrip } from "@/components/TrustStrip";
import { discountPercent, listProducts } from "@/lib/catalog";
import { CATEGORIES, DICTS, isLang } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = DICTS[lang];
  const products = await listProducts();
  const promos = products.filter((p) => discountPercent(p) > 0 && p.stock > 0);

  // Bannière : produits en promo, ceux mis en avant d'abord, puis les plus fortes remises.
  const slides: HeroSlide[] = [...promos]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || discountPercent(b) - discountPercent(a))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: productName(p, lang),
      price: p.price,
      compare: p.compare_at_price,
      off: discountPercent(p),
      image: p.image_url,
      endsAt: p.promo_ends_at ? new Date(p.promo_ends_at).toISOString() : null,
    }));

  return (
    <div className="space-y-14">
      <div className="animate-fade-up">
        <HeroCarousel slides={slides} lang={lang} />
      </div>

      <TrustStrip lang={lang} />

      {promos.length > 0 && (
        <section id="promos" className="scroll-mt-36">
          <Reveal>
            <SectionTitle>🔥 {t.promos}</SectionTitle>
          </Reveal>
          <ProductGrid products={promos} lang={lang} />
        </section>
      )}

      <section>
        <Reveal>
          <SectionTitle>{t.categories}</SectionTitle>
        </Reveal>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 60}>
              <Link
                href={`/${lang}/categorie/${c.slug}`}
                className="group card flex h-full flex-col items-center gap-3 p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-gold-300"
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition duration-300 group-hover:bg-brand-900 group-hover:text-gold-300">
                  <CategoryIcon slug={c.slug} className="size-7" />
                </span>
                <span className="text-sm font-semibold text-brand-950">{c[lang]}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="produits" className="scroll-mt-36">
        <Reveal>
          <SectionTitle>{t.allProducts}</SectionTitle>
        </Reveal>
        <ProductGrid products={products} lang={lang} />
      </section>
    </div>
  );
}
