import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listShippingRates } from "@/lib/catalog";
import { DICTS, isLang } from "@/lib/i18n";
import { enabledPaymentMethods, giftEnabled } from "@/lib/payments";
import { CheckoutClient } from "./CheckoutClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: DICTS[lang].cart } : {};
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const rates = await listShippingRates();
  return (
    <CheckoutClient
      lang={lang}
      rates={rates.map((r) => ({
        code: r.code,
        name: `${String(r.code).padStart(2, "0")} - ${lang === "ar" ? r.name_ar : r.name_fr}`,
        home: r.price_home,
        desk: r.price_desk,
      }))}
      payments={enabledPaymentMethods()}
      gift={giftEnabled()}
    />
  );
}
