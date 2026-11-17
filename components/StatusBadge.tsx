import { STATUS_LABELS, type OrderStatus } from "@/lib/types";

const BADGE: Record<OrderStatus, string> = {
  nouvelle: "bg-blue-100 text-blue-800",
  confirmee: "bg-amber-100 text-amber-800",
  expediee: "bg-purple-100 text-purple-800",
  livree: "bg-green-100 text-green-800",
  annulee: "bg-gray-200 text-gray-700",
  retour: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status]}`}>{STATUS_LABELS[status]}</span>;
}
