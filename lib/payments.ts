import "server-only";
import { chargilyEnabled } from "./chargily";

/**
 * Modes de paiement. Seul le paiement à la livraison est actif pour l'instant.
 *
 * Pour activer les paiements en ligne plus tard :
 *  - CIB / Edahabia : ouvrir un compte marchand Chargily Pay (https://chargily.com),
 *    renseigner CHARGILY_SECRET_KEY puis ENABLE_CHARGILY=true, et brancher
 *    la création du paiement dans app/(shop)/[lang]/panier/actions.ts (voir TODO).
 *  - Carte internationale (« offrir depuis l'étranger ») : compte Stripe,
 *    STRIPE_SECRET_KEY puis ENABLE_STRIPE_GIFT=true, même endroit.
 * Tant que l'intégration n'est pas branchée, l'option reste masquée même si le drapeau est à true.
 */
export type PaymentMethod = "cod" | "cib_edahabia" | "card_intl";

const INTEGRATED: Record<PaymentMethod, boolean> = {
  cod: true,
  cib_edahabia: true, // Chargily Pay (lib/chargily.ts)
  card_intl: false, // TODO : intégration Stripe Checkout
};

export function enabledPaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = ["cod"];
  if (chargilyEnabled() && INTEGRATED.cib_edahabia) methods.push("cib_edahabia");
  if (process.env.ENABLE_STRIPE_GIFT === "true" && INTEGRATED.card_intl) methods.push("card_intl");
  return methods;
}

/** L'option « offrir depuis l'étranger » n'a de sens qu'avec le paiement par carte internationale. */
export function giftEnabled() {
  return enabledPaymentMethods().includes("card_intl");
}
