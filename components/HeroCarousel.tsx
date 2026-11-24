"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DICTS, formatDA, type Lang } from "@/lib/i18n";
import { Countdown } from "./Countdown";

export type HeroSlide = {
  id: number;
  name: string;
  price: number;
  compare: number | null;
  off: number;
  image: string;
  endsAt: string | null;
};

const INTERVAL = 6000;

export function HeroCarousel({ slides, lang }: { slides: HeroSlide[]; lang: Lang }) {
  const t = DICTS[lang];
  const rtl = lang === "ar";
  const count = slides.length + 1; // + diapositive de présentation
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setTimeout(() => {
      if (document.visibilityState === "visible") next();
    }, INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, count, next]);

  const offset = (rtl ? 1 : -1) * index * 100;

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] bg-brand-950 text-white shadow-xl shadow-brand-950/20"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) < 50) return;
        // Glisser vers la gauche = suivant (inversé en arabe)
        if ((dx < 0) !== rtl) next();
        else prev();
      }}
    >
      {/* Décor : halos dorés */}
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[-6rem] size-80 rounded-full bg-gold-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 start-[-4rem] size-96 rounded-full bg-brand-500/30 blur-3xl" />

      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
        style={{ transform: `translateX(${offset}%)` }}
      >
        {/* Diapositive de présentation */}
        <Slide active={index === 0}>
          <div className="space-y-5">
            <p className="text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase">{t.heroKicker}</p>
            <h1 className="font-display text-4xl leading-[1.1] font-bold sm:text-5xl lg:text-6xl">
              {t.heroBrandTitle}
              <span className="text-gold-300">.</span>
            </h1>
            <p className="max-w-md text-base text-brand-100 sm:text-lg">{t.heroBrandText}</p>
            <a href="#produits" className="btn-gold px-6 py-3 text-base">
              {t.shopNow}
            </a>
          </div>
          <div className="relative hidden aspect-square w-full max-w-sm justify-self-center md:block">
            <div className="absolute inset-6 animate-float rounded-[2rem] bg-gradient-to-br from-gold-300 to-gold-500 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-[7rem] font-bold text-brand-950/90">514</span>
            </div>
          </div>
        </Slide>

        {slides.map((s, i) => (
          <Slide key={s.id} active={index === i + 1}>
            <div className="space-y-4">
              <span className="gold-shine inline-flex items-center gap-2 rounded-full bg-promo px-3 py-1 text-sm font-bold">
                <span dir="ltr">-{s.off}%</span> · {t.save} {formatDA((s.compare ?? s.price) - s.price, lang)}
              </span>
              <h2 className="font-display text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">{s.name}</h2>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gold-300">{formatDA(s.price, lang)}</span>
                {s.compare && <span className="text-lg text-brand-200 line-through">{formatDA(s.compare, lang)}</span>}
              </div>
              {s.endsAt && <Countdown endsAt={s.endsAt} lang={lang} tone="dark" />}
              <Link href={`/${lang}/produit/${s.id}`} className="btn-gold px-6 py-3 text-base">
                {t.seeOffer}
              </Link>
            </div>
            <Link
              href={`/${lang}/produit/${s.id}`}
              tabIndex={-1}
              className="relative order-first aspect-square w-full max-w-[16rem] justify-self-center overflow-hidden rounded-[1.75rem] bg-white/95 shadow-2xl ring-4 ring-gold-300/40 sm:max-w-xs md:order-none md:max-w-sm"
            >
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.name} className="h-full w-full object-cover" draggable={false} />
              ) : (
                <span dir="ltr" className="flex h-full items-center justify-center font-display text-6xl font-bold text-brand-800">-{s.off}%</span>
              )}
            </Link>
          </Slide>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-7 bg-gold-300" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={rtl ? next : prev}
            aria-label="‹"
            className="absolute start-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={rtl ? prev : next}
            aria-label="›"
            className="absolute end-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  );
}

function Slide({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div
      className="grid w-full shrink-0 items-center gap-8 px-6 pt-10 pb-14 sm:px-20 md:grid-cols-2 md:py-16"
      aria-hidden={!active}
      inert={!active}
    >
      {children}
    </div>
  );
}
