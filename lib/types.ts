export type Product = {
  id: number;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string;
  active: boolean;
  featured: boolean;
  promo_ends_at: Date | null;
};

export type ShippingRate = {
  code: number;
  name_fr: string;
  name_ar: string;
  price_home: number;
  price_desk: number;
  active: boolean;
};

export const ORDER_STATUSES = ["nouvelle", "confirmee", "expediee", "livree", "annulee", "retour"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
  retour: "Retour",
};

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "À la livraison",
  cib_edahabia: "CIB / Edahabia",
  card_intl: "Carte internationale",
};

/** Ce que le navigateur garde dans le panier (les prix sont toujours relus côté serveur). */
export type CartLine = { id: number; qty: number };

/** Produit tel qu'affiché côté client (nom déjà traduit). */
export type CartProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
};
