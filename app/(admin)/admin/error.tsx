"use client";

export default function AdminError() {
  return (
    <div className="card mx-auto mt-10 max-w-lg space-y-4 p-6 text-center">
      <h1 className="text-xl font-bold">Une erreur est survenue</h1>
      <p className="text-gray-600">La page de diagnostic indique en général la cause (souvent la connexion à la base de données).</p>
      <div className="flex flex-wrap justify-center gap-3">
        {/* Lien classique : recharge entièrement la page (la navigation interne peut être bloquée après une erreur). */}
        <a href="/admin/diagnostic" className="btn-primary">Ouvrir le diagnostic</a>
        <button onClick={() => window.location.reload()} className="btn-ghost">Réessayer</button>
      </div>
    </div>
  );
}
