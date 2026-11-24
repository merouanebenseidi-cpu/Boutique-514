"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

/** Galerie de la fiche produit : grande photo, miniatures, flèches et glisser au doigt. */
export function ProductGallery({
  images,
  alt,
  rtl,
  badge,
  placeholder,
}: {
  images: string[];
  alt: string;
  rtl: boolean;
  badge?: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const count = images.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  if (count === 0) {
    return (
      <div className="card relative aspect-square overflow-hidden">
        {placeholder}
        {badge}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="card group relative aspect-square touch-pan-y overflow-hidden select-none"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null || count < 2) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) < 40) return;
          go((dx < 0) !== rtl ? index + 1 : index - 1);
        }}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src}
            alt={i === index ? alt : ""}
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          />
        ))}
        {badge}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(rtl ? index + 1 : index - 1)}
              aria-label="‹"
              className="absolute start-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-950 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(rtl ? index - 1 : index + 1)}
              aria-label="›"
              className="absolute end-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-950 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute end-3 bottom-3 rounded-full bg-brand-950/75 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur" dir="ltr">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === index}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:size-20 ${i === index ? "border-gold-400 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
