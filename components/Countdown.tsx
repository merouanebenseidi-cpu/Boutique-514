"use client";

import { useEffect, useState } from "react";
import { DICTS, type Lang } from "@/lib/i18n";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * Compte à rebours jusqu'à la fin d'une promo.
 * - variant "blocks" : grandes cases (bannière, fiche produit)
 * - variant "chip" : petite pastille (cartes produits)
 * Rien n'est affiché avant le montage (évite un décalage d'heure serveur/navigateur) ni après la fin.
 */
export function Countdown({
  endsAt,
  lang,
  variant = "blocks",
  tone = "light",
}: {
  endsAt: string;
  lang: Lang;
  variant?: "blocks" | "chip";
  tone?: "light" | "dark";
}) {
  const t = DICTS[lang];
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(endsAt).getTime();
  if (now === null || Number.isNaN(end) || end <= now) return null;
  const p = parts(end - now);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (variant === "chip") {
    const label = p.d > 0 ? `${p.d}${t.units.d} ${pad(p.h)}${t.units.h}` : `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-promo/10 px-2 py-0.5 text-xs font-bold text-promo tabular-nums">
        <span aria-hidden>⏱</span>
        <span dir="ltr">{label}</span>
      </span>
    );
  }

  const cells: [number, string][] = [
    [p.d, t.units.d],
    [p.h, t.units.h],
    [p.m, t.units.m],
    [p.s, t.units.s],
  ];
  const box = tone === "dark" ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-brand-900 text-white";
  return (
    <div className="space-y-1.5">
      <p className={`text-xs font-semibold tracking-wide uppercase ${tone === "dark" ? "text-gold-200" : "text-promo"}`}>{t.endsIn}</p>
      <div className="flex gap-2" dir="ltr" role="timer" aria-live="off">
        {cells.map(([v, u], i) => (
          <div key={i} className={`flex min-w-14 flex-col items-center rounded-xl px-2.5 py-1.5 ${box}`}>
            <span className="text-xl font-extrabold tabular-nums leading-tight">{pad(v)}</span>
            <span className="text-[10px] font-medium opacity-80">{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
