"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import type { Lang } from "@/lib/i18n";

export function CartLink({ lang, label }: { lang: Lang; label: string }) {
  const { count } = useCart();
  // Petit rebond du badge quand un article est ajouté.
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), 400);
      prev.current = count;
      return () => clearTimeout(id);
    }
    prev.current = count;
  }, [count]);

  return (
    <Link
      href={`/${lang}/panier`}
      className="relative inline-flex items-center gap-2 rounded-xl bg-brand-900 px-3.5 py-2 font-semibold text-white transition hover:bg-brand-800"
    >
      <ShoppingBag className="size-5 text-gold-300" strokeWidth={1.75} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span
          className={`absolute -top-2 -end-2 min-w-5 rounded-full bg-gold-400 px-1.5 text-center text-xs leading-5 font-bold text-brand-950 shadow transition-transform duration-300 ${bump ? "scale-125" : "scale-100"}`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function LangSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname() || `/${lang}`;
  const other: Lang = lang === "fr" ? "ar" : "fr";
  const href = pathname.replace(/^\/(fr|ar)(?=\/|$)/, `/${other}`);
  return (
    <Link
      href={href}
      hrefLang={other}
      className="rounded-xl border border-brand-900/15 px-3 py-2 text-sm font-semibold text-brand-900 transition hover:border-gold-400 hover:bg-gold-100"
    >
      {other === "ar" ? "العربية" : "Français"}
    </Link>
  );
}

/** Ombre de l'en-tête quand on a défilé. */
export function HeaderShadow() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const onScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}
