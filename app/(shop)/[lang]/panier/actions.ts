"use server";

import { getProductsByIds } from "@/lib/catalog";
import { DICTS, isLang, type Lang } from "@/lib/i18n";
import { headers } from "next/headers";
import { createCheckout } from "@/lib/chargily";
import { cancelUnpaidOrder, createOrder, OrderFailure, OrderInput, setPaymentRef } from "@/lib/orders";
import { enabledPaymentMethods } from "@/lib/payments";
import type { CartProduct } from "@/lib/types";

/** Relit les produits du panier avec les prix et stocks à jour. */
export async function getCartProducts(ids: number[], lang: string): Promise<CartProduct[]> {
  if (!Array.isArray(ids) || ids.length > 50) return [];
  const l: Lang = isLang(lang) ? lang : "fr";
  const products = await getProductsByIds(ids.map(Number));
  return products.map((p) => ({
    id: p.id,
    name: l === "ar" && p.name_ar ? p.name_ar : p.name_fr,
    price: p.price,
    image_url: p.image_url,
    stock: p.stock,
  }));
}

export type PlaceOrderResult = { ok: true; number: string; redirect?: string } | { ok: false; error: string };

/** Adresse publique du site (https://…), déduite de la requête. */
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const lang: Lang = isLang((raw as { lang?: string })?.lang ?? "") ? (raw as { lang: Lang }).lang : "fr";
  const e = DICTS[lang].errors;

  const parsed = OrderInput.safeParse(raw);
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message as keyof typeof e;
    return { ok: false, error: e[key] && typeof e[key] === "string" ? e[key] : e.generic };
  }

  try {
    const order = await createOrder(parsed.data, enabledPaymentMethods());
    if (parsed.data.payment_method !== "cib_edahabia") return { ok: true, number: order.number };

    // Paiement CIB / Edahabia : création de la page de paiement Chargily.
    try {
      const origin = await siteOrigin();
      const n = encodeURIComponent(order.number);
      const checkout = await createCheckout({
        amount: order.total,
        orderNumber: order.number,
        locale: lang,
        successUrl: `${origin}/${lang}/merci?n=${n}&paiement=1`,
        failureUrl: `${origin}/${lang}/paiement-echoue?n=${n}`,
        webhookUrl: `${origin}/api/chargily/webhook`,
      });
      await setPaymentRef(order.id, checkout.id);
      return { ok: true, number: order.number, redirect: checkout.checkout_url };
    } catch (payErr) {
      // Paiement impossible à créer : on annule la commande (le stock est remis).
      console.error("chargily createCheckout", payErr);
      await cancelUnpaidOrder(order.id).catch(() => {});
      return { ok: false, error: e.onlinePayment };
    }
  } catch (err) {
    if (err instanceof OrderFailure) {
      const d = err.detail;
      return { ok: false, error: d.code === "stock" ? e.stock + d.product : e[d.code] };
    }
    console.error("placeOrder", err);
    return { ok: false, error: e.generic };
  }
}
