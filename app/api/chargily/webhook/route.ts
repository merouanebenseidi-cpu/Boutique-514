import { verifySignature } from "@/lib/chargily";
import { applyPaymentResult } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Notifications de Chargily Pay (paiement réussi, échoué ou annulé).
 * La signature (en-tête « signature ») est vérifiée avec la clé secrète :
 * seul Chargily peut marquer une commande comme payée.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("signature"))) {
    return new Response("Signature invalide", { status: 403 });
  }

  let event: { type?: string; data?: { id?: string; amount?: number; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const ref = event.data?.id;
  if (!ref) return Response.json({ ok: true, ignored: "sans identifiant" });

  let result: string;
  switch (event.type) {
    case "checkout.paid":
      result = await applyPaymentResult(ref, "paid", event.data?.amount);
      break;
    case "checkout.failed":
    case "checkout.canceled":
    case "checkout.expired":
      result = await applyPaymentResult(ref, "failed");
      break;
    default:
      result = "ignoré";
  }
  return Response.json({ ok: true, result });
}
