import type { Product } from "./types";

/** Toutes les photos d'un produit, la principale en premier. */
export function productImages(p: Pick<Product, "image_url" | "images">): string[] {
  const list = (p.images ?? []).filter(Boolean);
  if (list.length > 0) return list;
  return p.image_url ? [p.image_url] : [];
}
