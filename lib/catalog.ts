import "server-only";
import { db } from "./db";
import { ensureSchema } from "./migrate";
import { withEffectivePrice } from "./pricing";
import type { Product, ShippingRate } from "./types";

export async function listProducts(opts: { category?: string; promoOnly?: boolean } = {}) {
  await ensureSchema();
  const sql = db();
  const rows = await sql<Product[]>`
    select * from products
    where active
      ${opts.category ? sql`and category = ${opts.category}` : sql``}
    order by featured desc, (stock > 0) desc, created_at desc`;
  const products = rows.map((p) => withEffectivePrice(p));
  return opts.promoOnly ? products.filter((p) => discountPercent(p) > 0) : products;
}

export async function getProduct(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const sql = db();
  const [p] = await sql<Product[]>`select * from products where id = ${id} and active`;
  return p ? withEffectivePrice(p) : null;
}

export async function getProductsByIds(ids: number[]) {
  const clean = ids.filter((i) => Number.isSafeInteger(i) && i > 0);
  if (clean.length === 0) return [];
  const sql = db();
  const rows = await sql<Product[]>`select * from products where id in ${sql(clean)} and active`;
  return rows.map((p) => withEffectivePrice(p));
}

export async function listShippingRates(includeInactive = false) {
  const sql = db();
  return sql<ShippingRate[]>`
    select * from shipping_rates
    ${includeInactive ? sql`` : sql`where active`}
    order by code`;
}

export function discountPercent(p: Pick<Product, "price" | "compare_at_price">) {
  if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
  return Math.round((1 - p.price / p.compare_at_price) * 100);
}
