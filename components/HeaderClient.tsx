"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import type { Lang } from "@/lib/i18n";

export function CartLink({ lang, label }: { lang: Lang; label: string }) {
  const { count } = useCart();
  return (
    <Link href={`/${lang}/panier`} className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100">
      <span aria-hidden className="text-xl">🛒</span>
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className="absolute -top-1 end-0 min-w-5 rounded-full bg-promo px-1.5 text-center text-xs font-bold leading-5 text-white">
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
    <Link href={href} className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50" hrefLang={other}>
      {other === "ar" ? "العربية" : "Français"}
    </Link>
  );
}
