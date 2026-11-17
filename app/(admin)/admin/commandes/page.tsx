import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDA } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUSES, PAYMENT_LABELS, STATUS_LABELS, type OrderStatus } from "@/lib/types";

type Row = {
  id: number;
  number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  wilaya: string;
  total: number;
  payment_method: string;
  is_gift: boolean;
  created_at: Date;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin();
  const { statut } = await searchParams;
  const filter = (ORDER_STATUSES as readonly string[]).includes(statut ?? "") ? statut : undefined;
  const sql = db();

  const counts = await sql<{ status: OrderStatus; n: number }[]>`select status, count(*)::int as n from orders group by status`;
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const orders = await sql<Row[]>`
    select o.id, o.number, o.status, o.customer_name, o.phone, w.name_fr as wilaya, o.total,
           o.payment_method, o.is_gift, o.created_at
    from orders o join shipping_rates w on w.code = o.wilaya_code
    ${filter ? sql`where o.status = ${filter}` : sql``}
    order by o.created_at desc limit 200`;

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${active ? "bg-brand-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Commandes</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tab("/admin/commandes", "Toutes", !filter)}
        {ORDER_STATUSES.map((s) => tab(`/admin/commandes?statut=${s}`, `${STATUS_LABELS[s]} (${countOf(s)})`, filter === s))}
      </div>

      {orders.length === 0 ? (
        <p className="card p-8 text-center text-gray-500">Aucune commande.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-start text-gray-600">
              <tr>
                <th className="p-3 text-start">N°</th>
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-start">Client</th>
                <th className="p-3 text-start">Wilaya</th>
                <th className="p-3 text-start">Total</th>
                <th className="p-3 text-start">Paiement</th>
                <th className="p-3 text-start">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold">
                    <Link href={`/admin/commandes/${o.id}`} className="text-brand-700 hover:underline">
                      {o.number}
                    </Link>
                    {o.is_gift && <span title="Cadeau depuis l'étranger"> 🎁</span>}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-600">
                    {o.created_at.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Algiers" })}
                  </td>
                  <td className="p-3">
                    {o.customer_name}
                    <a href={`tel:${o.phone}`} className="block text-gray-500">{o.phone}</a>
                  </td>
                  <td className="p-3">{o.wilaya}</td>
                  <td className="whitespace-nowrap p-3 font-semibold">{formatDA(o.total, "fr")}</td>
                  <td className="p-3">{PAYMENT_LABELS[o.payment_method]}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
