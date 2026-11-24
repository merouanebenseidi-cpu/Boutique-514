"use client";

import { useState } from "react";
import { resizeImage } from "@/lib/resizeImage";
import { uploadImage } from "../actions";

const MAX = 10;

type Pending = { key: string; name: string; preview: string; error?: string };

/**
 * Photos d'un produit : envoi immédiat de chaque photo (réduite dans le navigateur),
 * choix de la principale, ordre, suppression. La liste part avec le formulaire
 * dans le champ caché « images ».
 */
export function PhotoManager({
  initial,
  uploads,
  onBusyChange,
}: {
  initial: string[];
  uploads: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [images, setImages] = useState<string[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const room = MAX - images.length - pending.filter((p) => !p.error).length;

  async function addFiles(files: FileList) {
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (list.length === 0) return;
    const items: Pending[] = list.map((f, i) => ({
      key: `${Date.now()}-${i}`,
      name: f.name,
      preview: URL.createObjectURL(f),
    }));
    setPending((p) => [...p, ...items]);
    onBusyChange(true);

    // Envoi l'une après l'autre pour garder l'ordre choisi.
    for (let i = 0; i < list.length; i++) {
      const item = items[i];
      try {
        const small = await resizeImage(list[i]);
        const fd = new FormData();
        fd.append("file", small);
        const res = await uploadImage(fd);
        if ("url" in res) {
          setImages((imgs) => [...imgs, res.url]);
          setPending((p) => p.filter((x) => x.key !== item.key));
        } else {
          setPending((p) => p.map((x) => (x.key === item.key ? { ...x, error: res.error } : x)));
        }
      } catch (e) {
        const msg = (e as Error)?.message || "Échec de l'envoi";
        setPending((p) => p.map((x) => (x.key === item.key ? { ...x, error: msg } : x)));
      }
    }
    onBusyChange(false);
  }

  function addLink() {
    const v = link.trim();
    if (!/^https:\/\//.test(v)) {
      setLinkError("Le lien doit commencer par https://");
      return;
    }
    if (images.length >= MAX) return;
    setImages((imgs) => [...imgs, v]);
    setLink("");
    setLinkError("");
  }

  const move = (i: number, d: -1 | 1) =>
    setImages((imgs) => {
      const j = i + d;
      if (j < 0 || j >= imgs.length) return imgs;
      const next = [...imgs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const makeMain = (i: number) => setImages((imgs) => [imgs[i], ...imgs.filter((_, k) => k !== i)]);
  const remove = (i: number) => setImages((imgs) => imgs.filter((_, k) => k !== i));

  return (
    <section className="card space-y-4 p-4">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Photos ({images.length}/{MAX})</h2>
        <p className="text-xs text-gray-500">La photo ★ principale s'affiche sur les cartes et dans la bannière.</p>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((src, i) => (
          <li key={src + i} className={`relative overflow-hidden rounded-xl border-2 ${i === 0 ? "border-gold-400" : "border-transparent"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="aspect-square w-full object-cover" />
            {i === 0 && (
              <span className="absolute start-1.5 top-1.5 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-brand-950">★ Principale</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/55 p-1 text-white">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 text-sm disabled:opacity-30" aria-label="Avancer">
                ←
              </button>
              {i !== 0 && (
                <button type="button" onClick={() => makeMain(i)} className="rounded px-1.5 text-xs font-bold" title="Mettre en photo principale">
                  ★
                </button>
              )}
              <button type="button" onClick={() => remove(i)} className="rounded px-1.5 text-sm" aria-label="Retirer" title="Retirer">
                ✕
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded px-1.5 text-sm disabled:opacity-30" aria-label="Reculer">
                →
              </button>
            </div>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.key} className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className={`aspect-square w-full object-cover ${p.error ? "opacity-40" : "animate-pulse opacity-60"}`} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs font-semibold">
              {p.error ? (
                <>
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-promo">{p.error}</span>
                  <button type="button" className="underline" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                    Fermer
                  </button>
                </>
              ) : (
                <span className="rounded bg-white/90 px-1.5 py-0.5 text-gray-700">Envoi…</span>
              )}
            </div>
          </li>
        ))}
        {images.length === 0 && pending.length === 0 && (
          <li className="col-span-full rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">Aucune photo pour l'instant.</li>
        )}
      </ul>

      <div className="flex flex-wrap items-start gap-4">
        {uploads && (
          <label className={`btn-primary cursor-pointer px-6 py-3 ${room <= 0 ? "pointer-events-none opacity-50" : ""}`}>
            📷 Ajouter des photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={room <= 0}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
        <div className="min-w-60 flex-1">
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder={uploads ? "… ou coller un lien d'image (https://…)" : "Lien de l'image (https://…)"}
              className="input"
              dir="ltr"
            />
            <button type="button" onClick={addLink} className="btn-ghost shrink-0">
              Ajouter
            </button>
          </div>
          {linkError && <p className="mt-1 text-xs text-promo">{linkError}</p>}
        </div>
      </div>
      {uploads && <p className="text-xs text-gray-500">Tu peux en sélectionner plusieurs d'un coup. Elles sont réduites automatiquement avant l'envoi.</p>}
    </section>
  );
}
