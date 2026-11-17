import Link from "next/link";
import { DICTS, formatDA, type Lang } from "@/lib/i18n";
import { discountPercent } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";

export function productName(p: Pick<Product, "name_fr" | "name_ar">, lang: Lang) {
  return lang === "ar" && p.name_ar ? p.name_ar : p.name_fr;
}

export function ProductImage({ p, className = "" }: { p: Product; className?: string }) {
  return p.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image_url} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <div className={`flex h-full w-full items-center justify-center bg-gray-100 text-5xl ${className}`} aria-hidden>
      📦
    </div>
  );
}

export function ProductCard({ p, lang }: { p: Product; lang: Lang }) {
  const t = DICTS[lang];
  const off = discountPercent(p);
  const out = p.stock <= 0;
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link href={`/${lang}/produit/${p.id}`} className="relative block aspect-square bg-gray-50">
        <ProductImage p={p} className={out ? "opacity-50" : ""} />
        {off > 0 && (
          <span className="absolute start-2 top-2 rounded-lg bg-promo px-2 py-0.5 text-sm font-bold text-white">-{off}%</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/${lang}/produit/${p.id}`} className="line-clamp-2 font-medium hover:underline">
          {productName(p, lang)}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-brand-700">{formatDA(p.price, lang)}</span>
          {off > 0 && <span className="text-sm text-gray-500 line-through">{formatDA(p.compare_at_price!, lang)}</span>}
        </div>
        <AddToCartButton id={p.id} disabled={out} label={t.addToCart} addedLabel={t.added} outLabel={t.outOfStock} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, lang }: { products: Product[]; lang: Lang }) {
  if (products.length === 0) return <p className="py-8 text-center text-gray-500">{DICTS[lang].noProducts}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} lang={lang} />
      ))}
    </div>
  );
}
