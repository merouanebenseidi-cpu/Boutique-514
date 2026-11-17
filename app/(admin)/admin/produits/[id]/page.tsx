import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageEnabled } from "@/lib/storage";
import type { Product } from "@/lib/types";
import { deleteProduct } from "../../actions";
import { ProductForm } from "../ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const [product] = await db()<Product[]>`select * from products where id = ${id}`;
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/produits" className="text-sm text-gray-600 hover:underline">← Produits</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{product.name_fr}</h1>
        {product.active && (
          <Link href={`/fr/produit/${product.id}`} target="_blank" className="text-sm text-brand-700 underline">Voir sur le site ↗</Link>
        )}
      </div>
      <ProductForm product={product} uploads={storageEnabled()} />

      <form action={deleteProduct} className="card border-red-200 p-4">
        <input type="hidden" name="id" value={product.id} />
        <p className="mb-3 text-sm text-gray-600">
          Pour une promo terminée, préfère décocher « Visible » : le produit reste disponible pour une prochaine fois.
        </p>
        <button className="btn border border-red-300 bg-white text-promo hover:bg-red-50">Supprimer définitivement</button>
      </form>
    </div>
  );
}
