import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Countdown } from "@/components/Countdown";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductImage, productName } from "@/components/ProductCard";
import { productImages } from "@/lib/productImages";
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
  const endsAt = off > 0 && p.promo_ends_at ? new Date(p.promo_ends_at).toISOString() : null;

  return (
    <div className="grid animate-fade-up gap-8 md:grid-cols-2 md:gap-12">
      <ProductGallery
        images={productImages(p)}
        alt={productName(p, lang)}
        rtl={lang === "ar"}
        placeholder={<ProductImage p={p} />}
        badge={
          off > 0 ? (
            <span dir="ltr" className="gold-shine absolute start-4 top-4 rounded-full bg-promo px-3 py-1.5 font-bold text-white shadow">-{off}%</span>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-5">
        <Link
          href={`/${lang}/categorie/${p.category}`}
          className="self-start rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 transition hover:bg-gold-100"
        >
          {categoryName(p.category, lang)}
        </Link>
        <h1 className="font-display text-3xl leading-tight font-bold text-brand-950 sm:text-4xl">{productName(p, lang)}</h1>

        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-extrabold text-brand-700">{formatDA(p.price, lang)}</span>
          {off > 0 && (
            <>
              <span className="text-xl text-gray-400 line-through">{formatDA(p.compare_at_price!, lang)}</span>
              <span className="rounded-full bg-promo/10 px-2.5 py-0.5 text-sm font-bold text-promo">
                {t.save} {formatDA(p.compare_at_price! - p.price, lang)}
              </span>
            </>
          )}
        </div>

        {endsAt && <Countdown endsAt={endsAt} lang={lang} />}

        <p className={`flex items-center gap-2 font-semibold ${out ? "text-promo" : "text-brand-600"}`}>
          <span className={`size-2.5 rounded-full ${out ? "bg-promo" : "animate-pulse bg-brand-500"}`} />
          {out ? t.outOfStock : t.inStock}
        </p>

        <AddToCartButton
          id={p.id}
          disabled={out}
          label={t.addToCart}
          addedLabel={t.added}
          outLabel={t.outOfStock}
          className="btn-primary w-full py-3.5 text-lg sm:w-auto sm:px-12"
        />
        {!out && (
          <Link href={`/${lang}/panier`} className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
            {t.cart} →
          </Link>
        )}

        <ul className="grid gap-2 rounded-2xl bg-brand-50/70 p-4 text-sm">
          {[
            [Truck, t.trust[0][0], t.trust[0][1]],
            [Banknote, t.trust[1][0], t.trust[1][1]],
            [ShieldCheck, t.trust[2][0], t.trust[2][1]],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Truck;
            return (
              <li key={title as string} className="flex items-center gap-3">
                <I className="size-5 shrink-0 text-brand-700" strokeWidth={1.75} aria-hidden />
                <span>
                  <strong className="text-brand-950">{title as string}</strong> · <span className="text-gray-600">{text as string}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {description && <div className="leading-relaxed whitespace-pre-line text-gray-700">{description}</div>}
      </div>
    </div>
  );
}
