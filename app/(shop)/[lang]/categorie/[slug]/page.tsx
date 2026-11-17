import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div>
      <h1 className="mb-5 text-2xl font-bold">
        <span aria-hidden>{c.icon}</span> {c[lang]}
      </h1>
      <ProductGrid products={products} lang={lang} />
    </div>
  );
}
