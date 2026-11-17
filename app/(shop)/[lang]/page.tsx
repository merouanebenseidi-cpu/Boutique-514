import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { listProducts } from "@/lib/catalog";
import { CATEGORIES, DICTS, isLang } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = DICTS[lang];
  const products = await listProducts();
  const promos = products.filter((p) => p.compare_at_price && p.compare_at_price > p.price && p.stock > 0);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-10 text-white sm:px-10">
        <h1 className="max-w-xl text-2xl font-extrabold leading-tight sm:text-4xl">{t.heroTitle}</h1>
        <p className="mt-3 text-brand-100">{t.heroText}</p>
        {promos.length > 0 && (
          <a href="#promos" className="btn mt-6 bg-white text-brand-700 hover:bg-brand-50">
            {t.heroCta}
          </a>
        )}
      </section>

      {promos.length > 0 && (
        <section id="promos" className="scroll-mt-32">
          <h2 className="mb-4 text-xl font-bold">🔥 {t.promos}</h2>
          <ProductGrid products={promos} lang={lang} />
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">{t.categories}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${lang}/categorie/${c.slug}`}
              className="card flex flex-col items-center gap-2 p-4 text-center hover:border-brand-500"
            >
              <span className="text-3xl" aria-hidden>{c.icon}</span>
              <span className="text-sm font-medium">{c[lang]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t.allProducts}</h2>
        <ProductGrid products={products} lang={lang} />
      </section>
    </div>
  );
}
