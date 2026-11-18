"use client";

import { useActionState, useState } from "react";
import { CATEGORIES } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { saveProduct } from "../actions";

export function ProductForm({ product, uploads }: { product?: Product; uploads: boolean }) {
  const [error, action, pending] = useActionState(saveProduct, null);
  const [preview, setPreview] = useState(product?.image_url ?? "");

  return (
    <form action={action} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      <section className="card grid gap-4 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Nom (français) *</span>
          <input name="name_fr" required defaultValue={product?.name_fr} className="input" />
        </label>
        <label className="block">
          <span className="label">Nom (arabe)</span>
          <input name="name_ar" dir="rtl" defaultValue={product?.name_ar} className="input" />
        </label>
        <label className="block">
          <span className="label">Description (français)</span>
          <textarea name="description_fr" rows={4} defaultValue={product?.description_fr} className="input" />
        </label>
        <label className="block">
          <span className="label">Description (arabe)</span>
          <textarea name="description_ar" rows={4} dir="rtl" defaultValue={product?.description_ar} className="input" />
        </label>
        <label className="block">
          <span className="label">Catégorie *</span>
          <select name="category" required defaultValue={product?.category ?? ""} className="input">
            <option value="" disabled>Choisir…</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.fr}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="card grid gap-4 p-4 sm:grid-cols-3">
        <label className="block">
          <span className="label">Prix de vente (DA) *</span>
          <input name="price" required inputMode="numeric" defaultValue={product?.price} className="input" />
        </label>
        <label className="block">
          <span className="label">Prix barré (DA)</span>
          <input name="compare_at_price" inputMode="numeric" defaultValue={product?.compare_at_price ?? ""} className="input" placeholder="Vide = pas de promo" />
        </label>
        <label className="block">
          <span className="label">Stock *</span>
          <input name="stock" required inputMode="numeric" defaultValue={product?.stock ?? 1} className="input" />
        </label>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">Photo</h2>
        <div className="flex flex-wrap items-start gap-4">
          <div className="size-32 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-4xl">📦</span>
            )}
          </div>
          <div className="min-w-60 flex-1 space-y-3">
            {uploads && (
              <label className="block">
                <span className="label">📷 Envoyer une photo (JPG, PNG, WebP · 4 Mo max)</span>
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="block w-full cursor-pointer text-sm text-gray-600 file:me-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-brand-700"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPreview(URL.createObjectURL(f));
                  }}
                />
              </label>
            )}
            <label className="block">
              <span className="label">{uploads ? "… ou coller un lien d'image" : "Lien de l'image (https://…)"}</span>
              <input name="image_url" defaultValue={product?.image_url} className="input" dir="ltr" onChange={(e) => setPreview(e.target.value)} />
            </label>
          </div>
        </div>
      </section>

      <section className="card flex flex-wrap gap-6 p-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="size-4 accent-brand-600" />
          Visible sur le site
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="size-4 accent-brand-600" />
          Mettre en avant (affiché en premier)
        </label>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-promo">{error}</p>}

      <button className="btn-primary px-8" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
