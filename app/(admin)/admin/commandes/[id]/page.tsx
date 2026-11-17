import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDA } from "@/lib/i18n";
import { ORDER_STATUSES, PAYMENT_LABELS, STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "../../actions";
import { StatusBadge } from "@/components/StatusBadge";

type Order = {
  id: number;
  number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  wilaya_code: number;
  wilaya: string;
  commune: string;
  address: string;
  delivery_type: "home" | "desk";
  shipping_price: number;
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  is_gift: boolean;
  sender_name: string | null;
  sender_email: string | null;
  sender_country: string | null;
  gift_message: string | null;
  note: string;
  lang: string;
  created_at: Date;
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const sql = db();
  const [o] = await sql<Order[]>`
    select o.*, w.name_fr as wilaya from orders o join shipping_rates w on w.code = o.wilaya_code where o.id = ${id}`;
  if (!o) notFound();
  const items = await sql<{ id: number; product_id: number | null; name: string; unit_price: number; quantity: number }[]>`
    select * from order_items where order_id = ${id} order by id`;

  const waPhone = o.phone.replace(/^0/, "213");

  return (
    <div className="space-y-5">
      <Link href="/admin/commandes" className="text-sm text-gray-600 hover:underline">← Commandes</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{o.number}</h1>
        <StatusBadge status={o.status} />
        {o.is_gift && <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-pink-800">🎁 Cadeau</span>}
      </div>
      <p className="text-sm text-gray-600">
        Passée le {o.created_at.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Algiers" })} · site en {o.lang === "ar" ? "arabe" : "français"}
      </p>

      <form key={o.status} action={updateOrderStatus} className="card flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="id" value={o.id} />
        <label>
          <span className="label">Changer le statut</span>
          <select name="status" defaultValue={o.status} className="input">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary">Enregistrer</button>
        <p className="w-full text-xs text-gray-500">« Annulée » ou « Retour » remet les articles en stock automatiquement.</p>
      </form>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">{o.is_gift ? "Destinataire (en Algérie)" : "Client"}</h2>
          <p className="text-lg">{o.customer_name}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${o.phone}`} className="btn-ghost py-1.5 text-sm">📞 {o.phone}</a>
            <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="btn-ghost py-1.5 text-sm">💬 WhatsApp</a>
          </div>
          <p>
            <strong>{String(o.wilaya_code).padStart(2, "0")} - {o.wilaya}</strong>, {o.commune}
          </p>
          <p>{o.delivery_type === "home" ? `À domicile : ${o.address}` : "Retrait au bureau du livreur (stop desk)"}</p>
          {o.note && <p className="rounded-lg bg-amber-50 p-2 text-sm">📝 {o.note}</p>}
        </section>

        {o.is_gift && (
          <section className="card space-y-2 p-4">
            <h2 className="font-semibold">Acheteur (depuis l'étranger)</h2>
            <p>{o.sender_name}</p>
            <p><a className="text-brand-700 underline" href={`mailto:${o.sender_email}`}>{o.sender_email}</a></p>
            {o.sender_country && <p>{o.sender_country}</p>}
            {o.gift_message && <p className="rounded-lg bg-pink-50 p-2 text-sm">💌 {o.gift_message}</p>}
          </section>
        )}

        <section className="card p-4 md:col-span-2">
          <h2 className="mb-3 font-semibold">Articles</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2">
                    {i.product_id ? (
                      <Link href={`/admin/produits/${i.product_id}`} className="hover:underline">{i.name}</Link>
                    ) : (
                      i.name
                    )}
                  </td>
                  <td className="py-2 text-center">× {i.quantity}</td>
                  <td className="py-2 text-end">{formatDA(i.unit_price * i.quantity, "fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatDA(o.subtotal, "fr")}</dd></div>
            <div className="flex justify-between"><dt>Livraison</dt><dd>{formatDA(o.shipping_price, "fr")}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total à encaisser</dt><dd>{formatDA(o.total, "fr")}</dd></div>
            <div className="flex justify-between text-gray-600">
              <dt>Paiement</dt>
              <dd>{PAYMENT_LABELS[o.payment_method]} · {o.payment_status === "paid" ? "payé" : "non payé"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
