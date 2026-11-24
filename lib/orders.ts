import "server-only";
import { z } from "zod";
import { db } from "./db";
import { ensureSchema } from "./migrate";
import { withEffectivePrice } from "./pricing";
import type { PaymentMethod } from "./payments";

/** Normalise un numéro algérien vers le format 0XXXXXXXXX. Renvoie null s'il est invalide. */
export function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  if (/^0[567]\d{8}$/.test(p)) return p; // mobile
  if (/^0[2-4]\d{7}$/.test(p)) return p; // fixe
  return null;
}

export const OrderInput = z.object({
  lang: z.enum(["fr", "ar"]),
  items: z
    .array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(50) }))
    .min(1, "cart")
    .max(50),
  customer_name: z.string().trim().min(2, "name").max(100),
  phone: z.string().trim().max(30),
  wilaya_code: z.number().int().positive("wilaya"),
  commune: z.string().trim().min(2, "commune").max(100),
  address: z.string().trim().max(300),
  delivery_type: z.enum(["home", "desk"]),
  payment_method: z.enum(["cod", "cib_edahabia", "card_intl"]),
  note: z.string().trim().max(500).default(""),
  is_gift: z.boolean().default(false),
  sender_name: z.string().trim().max(100).optional(),
  sender_email: z.string().trim().max(200).optional(),
  sender_country: z.string().trim().max(100).optional(),
  gift_message: z.string().trim().max(500).optional(),
});
export type OrderInput = z.infer<typeof OrderInput>;

export type OrderError =
  | { code: "name" | "phone" | "wilaya" | "commune" | "address" | "cart" | "unavailable" | "payment" | "sender" | "generic" }
  | { code: "stock"; product: string };

export class OrderFailure extends Error {
  constructor(public detail: OrderError) {
    super(detail.code);
  }
}

type LockedProduct = {
  id: number;
  name_fr: string;
  name_ar: string;
  price: number;
  compare_at_price: number | null;
  promo_ends_at: Date | null;
  stock: number;
  active: boolean;
};

/**
 * Crée la commande dans une transaction : relit les prix et le stock en base
 * (jamais ceux envoyés par le navigateur), calcule la livraison, décrémente le stock.
 */
export async function createOrder(input: OrderInput, allowedPayments: PaymentMethod[]) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new OrderFailure({ code: "phone" });
  if (input.delivery_type === "home" && input.address.length < 5) throw new OrderFailure({ code: "address" });
  if (!allowedPayments.includes(input.payment_method)) throw new OrderFailure({ code: "payment" });
  if (input.is_gift) {
    if (!input.sender_name || !input.sender_email || !/^\S+@\S+\.\S+$/.test(input.sender_email))
      throw new OrderFailure({ code: "sender" });
  }

  // Regroupe les doublons éventuels du panier.
  const qtyById = new Map<number, number>();
  for (const it of input.items) qtyById.set(it.id, (qtyById.get(it.id) ?? 0) + it.qty);
  const ids = [...qtyById.keys()].sort((a, b) => a - b);

  await ensureSchema();
  const sql = db();
  return sql.begin(async (tx) => {
    const [rate] = await tx<{ price_home: number; price_desk: number }[]>`
      select price_home, price_desk from shipping_rates where code = ${input.wilaya_code} and active`;
    if (!rate) throw new OrderFailure({ code: "wilaya" });

    // Verrouille les lignes produits pour éviter de vendre deux fois le dernier article.
    const products = await tx<LockedProduct[]>`
      select id, name_fr, name_ar, price, compare_at_price, promo_ends_at, stock, active from products
      where id in ${tx(ids)} order by id for update`;
    // Prix effectif : une promo terminée repasse au prix normal.
    const byId = new Map(products.map((p) => [p.id, withEffectivePrice(p)]));

    let subtotal = 0;
    const lines: { product: LockedProduct; qty: number }[] = [];
    for (const id of ids) {
      const p = byId.get(id);
      const qty = qtyById.get(id)!;
      if (!p || !p.active) throw new OrderFailure({ code: "unavailable" });
      if (p.stock < qty) {
        throw new OrderFailure({ code: "stock", product: input.lang === "ar" && p.name_ar ? p.name_ar : p.name_fr });
      }
      subtotal += p.price * qty;
      lines.push({ product: p, qty });
    }

    const shipping = input.delivery_type === "home" ? rate.price_home : rate.price_desk;
    const [{ n }] = await tx<{ n: string }[]>`select nextval('order_number_seq')::text as n`;
    const number = `B514-${n}`;

    const [order] = await tx<{ id: number }[]>`
      insert into orders ${tx({
        number,
        customer_name: input.customer_name,
        phone,
        wilaya_code: input.wilaya_code,
        commune: input.commune,
        address: input.address,
        delivery_type: input.delivery_type,
        shipping_price: shipping,
        subtotal,
        total: subtotal + shipping,
        payment_method: input.payment_method,
        is_gift: input.is_gift,
        sender_name: input.is_gift ? input.sender_name ?? null : null,
        sender_email: input.is_gift ? input.sender_email ?? null : null,
        sender_country: input.is_gift ? input.sender_country ?? null : null,
        gift_message: input.is_gift ? input.gift_message ?? null : null,
        note: input.note,
        lang: input.lang,
      })}
      returning id`;

    for (const { product, qty } of lines) {
      await tx`
        insert into order_items ${tx({
          order_id: order.id,
          product_id: product.id,
          name: product.name_fr,
          unit_price: product.price,
          quantity: qty,
        })}`;
      await tx`update products set stock = stock - ${qty}, updated_at = now() where id = ${product.id}`;
    }

    return { number, total: subtotal + shipping };
  });
}

/** Remet le stock quand une commande est annulée ou retournée (et le retire si on revient en arrière). */
export async function setOrderStatus(orderId: number, status: string) {
  const sql = db();
  await sql.begin(async (tx) => {
    const [o] = await tx<{ status: string }[]>`select status from orders where id = ${orderId} for update`;
    if (!o || o.status === status) return;
    const released = (s: string) => s === "annulee" || s === "retour";
    const delta = !released(o.status) && released(status) ? 1 : released(o.status) && !released(status) ? -1 : 0;
    if (delta !== 0) {
      await tx`
        update products p set stock = greatest(0, p.stock + ${delta} * i.quantity), updated_at = now()
        from order_items i where i.order_id = ${orderId} and i.product_id = p.id`;
    }
    await tx`update orders set status = ${status} where id = ${orderId}`;
  });
}
