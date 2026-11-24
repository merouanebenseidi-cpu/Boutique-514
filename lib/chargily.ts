import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cleanEnv } from "./env";

/**
 * Chargily Pay V2 : paiement par carte CIB et Edahabia.
 * Documentation : https://dev.chargily.com/pay-v2/introduction
 *
 * - Clé de test (commence par « test_ ») → environnement de test, aucun argent réel.
 * - Clé live → vrais paiements (compte et application vérifiés par Chargily).
 */

export function chargilyKey() {
  return cleanEnv(process.env.CHARGILY_SECRET_KEY);
}

export function chargilyEnabled() {
  return chargilyKey().length > 0 && cleanEnv(process.env.ENABLE_CHARGILY) !== "false";
}

export function chargilyTestMode() {
  return chargilyKey().startsWith("test_");
}

function apiBase() {
  // CHARGILY_API_URL ne sert qu'aux tests automatisés (faux serveur local).
  const override = cleanEnv(process.env.CHARGILY_API_URL);
  if (override) return override.replace(/\/$/, "");
  return chargilyTestMode() ? "https://pay.chargily.net/test/api/v2" : "https://pay.chargily.net/api/v2";
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${chargilyKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok) {
    const msg = (data as { message?: string } | null)?.message || text.slice(0, 200) || res.statusText;
    throw new Error(`Chargily ${res.status} : ${msg}`);
  }
  return data as T;
}

export type ChargilyCheckout = { id: string; checkout_url: string; status: string; amount: number };

/** Crée la page de paiement Chargily pour une commande. */
export function createCheckout(opts: {
  amount: number;
  orderNumber: string;
  locale: "fr" | "ar";
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
}) {
  return call<ChargilyCheckout>("POST", "/checkouts", {
    amount: opts.amount,
    currency: "dzd",
    payment_method: "edahabia", // le client peut choisir CIB sur la page de paiement
    success_url: opts.successUrl,
    failure_url: opts.failureUrl,
    webhook_endpoint: opts.webhookUrl,
    description: `Commande ${opts.orderNumber}`,
    locale: opts.locale,
    // Les frais Chargily sont à la charge de la boutique : le client paie exactement le total affiché.
    chargily_pay_fees_allocation: "merchant",
    metadata: [{ order_number: opts.orderNumber }],
  });
}

/** Vérifie la clé en lisant le solde (utilisé par le diagnostic). */
export function getBalance() {
  return call<{ livemode: boolean; wallets?: { currency: string; balance: number }[] }>("GET", "/balance");
}

/** Vérifie la signature d'une notification (HMAC-SHA256 du corps brut avec la clé secrète). */
export function verifySignature(rawBody: string, signature: string | null) {
  if (!signature || !chargilyKey()) return false;
  const expected = createHmac("sha256", chargilyKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}
