import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ProductGrid } from "@/components/ProductCard";
import { listProducts } from "@/lib/catalog";
import { CATEGORIES, isLang } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const c = CATEGORIES.find((c) => c.slug === slug);
  return c && isLang(lang) ? { title: c[lang] } : {};
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;
  const c = CATEGORIES.find((c) => c.slug === slug);
  if (!isLang(lang) || !c) notFound();
  const products = await listProducts({ category: slug });
  return (
    <div className="space-y-6">
      <div className="flex animate-fade-up items-center gap-4 rounded-[1.75rem] bg-brand-950 px-6 py-8 text-white">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
          <CategoryIcon slug={c.slug} className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">{c[lang]}</h1>
          <p className="text-sm text-brand-200">{products.length} {lang === "ar" ? "منتج" : products.length > 1 ? "produits" : "produit"}</p>
        </div>
      </div>
      <ProductGrid products={products} lang={lang} />
    </div>
  );
}
