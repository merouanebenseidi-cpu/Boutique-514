"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { productImages } from "@/lib/productImages";
import { saveProduct } from "../actions";
import { PhotoManager } from "./PhotoManager";

export function ProductForm({ product, uploads }: { product?: Product; uploads: boolean }) {
  const router = useRouter();
  const [error, action, pending] = useActionState(async (prev: string | null, form: FormData) => {
    try {
      const res = await saveProduct(prev, form);
      if (res === "ok") {
        router.push("/admin/produits");
        router.refresh();
        return null;
      }
      return res;
    } catch (e) {
      // Session expirée : laisser Next.js rediriger vers la connexion.
      if (String((e as { digest?: string })?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
      return `Erreur pendant l'envoi : ${(e as Error)?.message || String(e)}. Vérifie ta connexion et réessaie ; si ça continue, envoie une capture de ce message.`;
    }
  }, null);
  // Vrai pendant l'envoi des photos : empêche d'enregistrer avant la fin.
  const [resizing, setResizing] = useState(false);
  // Date de fin affichée dans le fuseau de l'appareil (calculée après le montage pour éviter un décalage serveur/navigateur).
  const [promoLocal, setPromoLocal] = useState("");
  useEffect(() => {
    if (!product?.promo_ends_at) return;
    const d = new Date(product.promo_ends_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setPromoLocal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [product?.promo_ends_at]);

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
        <div className="sm:col-span-3">
          <label className="block sm:max-w-xs">
            <span className="label">⏱ Fin de la promo (facultatif)</span>
            <input
              type="datetime-local"
              value={promoLocal}
              onChange={(e) => setPromoLocal(e.target.value)}
              className="input"
            />
          </label>
          {/* Envoyée en heure universelle : l'heure saisie est celle de ton appareil. */}
          <input type="hidden" name="promo_ends_at" value={promoLocal ? new Date(promoLocal).toISOString() : ""} />
          <p className="mt-1 text-xs text-gray-500">
            Affiche un compte à rebours sur le site. À cette date, le produit repasse automatiquement au prix barré.
            {promoLocal && (
              <button type="button" className="ms-2 underline" onClick={() => setPromoLocal("")}>Retirer la date</button>
            )}
          </p>
        </div>
      </section>

      <PhotoManager initial={productImages(product ?? { image_url: "", images: [] })} uploads={uploads} onBusyChange={setResizing} />

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

      <button className="btn-primary px-8" disabled={pending || resizing}>
        {pending ? "Enregistrement…" : resizing ? "Envoi des photos…" : "Enregistrer"}
      </button>
    </form>
  );
}
