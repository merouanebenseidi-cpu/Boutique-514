"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="card mx-auto mt-16 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">Connexion admin</h1>
      <label className="block">
        <span className="label">Mot de passe</span>
        <input name="password" type="password" required autoFocus autoComplete="current-password" className="input" />
      </label>
      {error && <p role="alert" className="text-sm font-medium text-promo">{error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
