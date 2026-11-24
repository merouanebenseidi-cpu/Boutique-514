import Link from "next/link";
import { DICTS, formatDA, type Lang } from "@/lib/i18n";
import { discountPercent } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { CategoryIcon } from "./CategoryIcon";
import { Countdown } from "./Countdown";
import { Reveal } from "./Reveal";

export function productName(p: Pick<Product, "name_fr" | "name_ar">, lang: Lang) {
  return lang === "ar" && p.name_ar ? p.name_ar : p.name_fr;
}

export function ProductImage({ p, className = "" }: { p: Product; className?: string }) {
  return p.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image_url} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-gold-100 ${className}`} aria-hidden>
      <CategoryIcon slug={p.category} className="size-14 text-brand-700/60" />
    </div>
  );
}

export function ProductCard({ p, lang }: { p: Product; lang: Lang }) {
  const t = DICTS[lang];
  const off = discountPercent(p);
  const out = p.stock <= 0;
  const endsAt = off > 0 && p.promo_ends_at ? new Date(p.promo_ends_at).toISOString() : null;
  return (
    <article className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(8,44,31,0.35)]">
      <Link href={`/${lang}/produit/${p.id}`} className="relative block aspect-square overflow-hidden bg-brand-50">
        <ProductImage p={p} className={`transition duration-500 group-hover:scale-[1.06] ${out ? "opacity-50 grayscale" : ""}`} />
        {off > 0 && (
          <span dir="ltr" className="gold-shine absolute start-3 top-3 rounded-full bg-promo px-2.5 py-1 text-xs font-bold text-white shadow">
            -{off}%
          </span>
        )}
        {p.featured && !out && (
          <span className="absolute end-3 top-3 rounded-full bg-brand-950/80 px-2 py-1 text-[10px] font-bold tracking-wider text-gold-300 uppercase backdrop-blur">
            ★
          </span>
        )}
        {out && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-1 text-center text-xs font-semibold text-gray-700">
            {t.outOfStock}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {endsAt && <Countdown endsAt={endsAt} lang={lang} variant="chip" />}
        <Link href={`/${lang}/produit/${p.id}`} className="line-clamp-2 leading-snug font-semibold text-ink transition hover:text-brand-700">
          {productName(p, lang)}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold text-brand-700">{formatDA(p.price, lang)}</span>
          {off > 0 && <span className="text-sm text-gray-400 line-through">{formatDA(p.compare_at_price!, lang)}</span>}
        </div>
        <AddToCartButton id={p.id} disabled={out} label={t.addToCart} addedLabel={t.added} outLabel={t.outOfStock} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, lang }: { products: Product[]; lang: Lang }) {
  if (products.length === 0) return <p className="py-8 text-center text-gray-500">{DICTS[lang].noProducts}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 80}>
          <ProductCard p={p} lang={lang} />
        </Reveal>
      ))}
    </div>
  );
}

/** Titre de section avec filet doré. */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-bold text-brand-950 sm:text-3xl">
        {children}
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-gold-400 to-gold-200" />
      </h2>
      {action}
    </div>
  );
}
