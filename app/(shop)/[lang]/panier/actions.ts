"use server";

import { getProductsByIds } from "@/lib/catalog";
import { DICTS, isLang, type Lang } from "@/lib/i18n";
import { createOrder, OrderFailure, OrderInput } from "@/lib/orders";
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

export type PlaceOrderResult = { ok: true; number: string } | { ok: false; error: string };

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const lang: Lang = isLang((raw as { lang?: string })?.lang ?? "") ? (raw as { lang: Lang }).lang : "fr";
  const e = DICTS[lang].errors;

  const parsed = OrderInput.safeParse(raw);
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message as keyof typeof e;
    return { ok: false, error: e[key] && typeof e[key] === "string" ? e[key] : e.generic };
  }

  try {
    // TODO paiements en ligne : si payment_method !== "cod", créer ici le paiement
    // (Chargily Pay ou Stripe Checkout) et renvoyer l'URL de paiement au lieu du numéro.
    const { number } = await createOrder(parsed.data, enabledPaymentMethods());
    return { ok: true, number };
  } catch (err) {
    if (err instanceof OrderFailure) {
      const d = err.detail;
      return { ok: false, error: d.code === "stock" ? e.stock + d.product : e[d.code] };
    }
    console.error("placeOrder", err);
    return { ok: false, error: e.generic };
  }
}
