"use client";

import { useActionState } from "react";
import { addWilaya } from "../actions";

export function AddWilayaForm() {
  const [error, action, pending] = useActionState(addWilaya, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-semibold">Ajouter une wilaya</h2>
      <div className="grid gap-3 sm:grid-cols-5">
        <input name="code" required inputMode="numeric" placeholder="Code (ex. 59)" className="input" />
        <input name="name_fr" required placeholder="Nom en français" className="input" />
        <input name="name_ar" required dir="rtl" placeholder="الاسم بالعربية" className="input" />
        <input name="price_home" required inputMode="numeric" placeholder="Domicile (DA)" className="input" />
        <input name="price_desk" required inputMode="numeric" placeholder="Bureau (DA)" className="input" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-promo">{error}</p>}
      <button className="btn-ghost" disabled={pending}>Ajouter</button>
    </form>
  );
}
