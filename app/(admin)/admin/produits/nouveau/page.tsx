import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { storageEnabled } from "@/lib/storage";
import { ProductForm } from "../ProductForm";

export default async function NewProduct() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <Link href="/admin/produits" className="text-sm text-gray-600 hover:underline">← Produits</Link>
      <h1 className="text-2xl font-bold">Nouveau produit</h1>
      <ProductForm uploads={storageEnabled()} />
    </div>
  );
}
