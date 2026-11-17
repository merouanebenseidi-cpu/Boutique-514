import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { discountPercent } from "@/lib/catalog";
import { db } from "@/lib/db";
import { categoryName, formatDA } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { toggleProduct } from "../actions";

export default async function ProductsAdmin() {
  await requireAdmin();
  const products = await db()<Product[]>`select * from products order by active desc, created_at desc`;

  const Toggle = ({ p, field, on, label }: { p: Product; field: "active" | "featured"; on: boolean; label: string }) => (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="field" value={field} />
      <button
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
        title="Cliquer pour changer"
      >
        {label}
      </button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produits ({products.length})</h1>
        <Link href="/admin/produits/nouveau" className="btn-primary">+ Ajouter un produit</Link>
      </div>

      {products.length === 0 ? (
        <p className="card p-8 text-center text-gray-500">Aucun produit. Ajoute ta première promotion.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-start">Produit</th>
                <th className="p-3 text-start">Catégorie</th>
                <th className="p-3 text-start">Prix</th>
                <th className="p-3 text-start">Stock</th>
                <th className="p-3 text-start">Visible</th>
                <th className="p-3 text-start">En avant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const off = discountPercent(p);
                return (
                  <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                    <td className="p-3">
                      <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center">📦</span>
                          )}
                        </span>
                        <span className="font-medium">{p.name_fr}</span>
                      </Link>
                    </td>
                    <td className="p-3">{categoryName(p.category, "fr")}</td>
                    <td className="whitespace-nowrap p-3">
                      <span className="font-semibold">{formatDA(p.price, "fr")}</span>
                      {off > 0 && <span className="ms-2 rounded bg-red-100 px-1.5 text-xs font-bold text-promo">-{off}%</span>}
                    </td>
                    <td className={`p-3 ${p.stock === 0 ? "font-semibold text-promo" : ""}`}>{p.stock}</td>
                    <td className="p-3"><Toggle p={p} field="active" on={p.active} label={p.active ? "Oui" : "Masqué"} /></td>
                    <td className="p-3"><Toggle p={p} field="featured" on={p.featured} label={p.featured ? "Oui" : "Non"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
