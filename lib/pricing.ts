/** Règles de prix partagées par le site, le panier et la création de commande. */

type Priced = { price: number; compare_at_price: number | null; promo_ends_at?: Date | string | null };

/** La promo est terminée : la date de fin est passée. */
export function promoExpired(p: Priced, now = new Date()) {
  return Boolean(p.promo_ends_at && new Date(p.promo_ends_at) <= now);
}

/**
 * Prix réellement appliqué : à la fin d'une promo, le produit revient au prix barré
 * (son prix normal) et n'affiche plus de remise.
 */
export function withEffectivePrice<T extends Priced>(p: T, now = new Date()): T {
  if (!promoExpired(p, now)) return p;
  const normal = p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : p.price;
  return { ...p, price: normal, compare_at_price: null, promo_ends_at: null };
}
