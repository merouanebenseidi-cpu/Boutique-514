import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage, productName } from "@/components/ProductCard";
import { discountPercent, getProduct } from "@/lib/catalog";
import { categoryName, DICTS, formatDA, isLang } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  const p = await getProduct(Number(id));
  return p && isLang(lang) ? { title: productName(p, lang) } : {};
}

export default async function ProductPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const p = await getProduct(Number(id));
  if (!p) notFound();
  const t = DICTS[lang];
  const off = discountPercent(p);
  const out = p.stock <= 0;
  const description = lang === "ar" && p.description_ar ? p.description_ar : p.description_fr;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card relative aspect-square overflow-hidden">
        <ProductImage p={p} />
        {off > 0 && (
          <span className="absolute start-3 top-3 rounded-lg bg-promo px-2.5 py-1 font-bold text-white">-{off}%</span>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <Link href={`/${lang}/categorie/${p.category}`} className="text-sm text-brand-700 hover:underline">
          {categoryName(p.category, lang)}
        </Link>
        <h1 className="text-2xl font-bold">{productName(p, lang)}</h1>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-extrabold text-brand-700">{formatDA(p.price, lang)}</span>
          {off > 0 && <span className="text-lg text-gray-500 line-through">{formatDA(p.compare_at_price!, lang)}</span>}
        </div>
        <p className={out ? "font-medium text-promo" : "font-medium text-brand-700"}>
          {out ? t.outOfStock : t.inStock}
        </p>
        <AddToCartButton
          id={p.id}
          disabled={out}
          label={t.addToCart}
          addedLabel={t.added}
          outLabel={t.outOfStock}
          className="btn-primary w-full py-3 text-lg sm:w-auto sm:px-10"
        />
        {!out && (
          <Link href={`/${lang}/panier`} className="text-center text-sm text-gray-600 underline sm:text-start">
            {t.cart} →
          </Link>
        )}
        {description && <div className="whitespace-pre-line leading-relaxed text-gray-700">{description}</div>}
      </div>
    </div>
  );
}
