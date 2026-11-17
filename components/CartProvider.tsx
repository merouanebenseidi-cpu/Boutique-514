"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

const KEY = "boutique514_cart_v1";

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((l) => Number.isInteger(l?.id) && Number.isInteger(l?.qty) && l.qty > 0)
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* stockage indisponible (navigation privée) : le panier reste en mémoire */
    }
  }, [lines, ready]);

  const add = useCallback((id: number, qty = 1) => {
    setLines((ls) => {
      const found = ls.find((l) => l.id === id);
      if (found) return ls.map((l) => (l.id === id ? { ...l, qty: Math.min(50, l.qty + qty) } : l));
      return [...ls, { id, qty }];
    });
  }, []);
  const setQty = useCallback((id: number, qty: number) => {
    setLines((ls) =>
      qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty: Math.min(50, qty) } : l)),
    );
  }, []);
  const remove = useCallback((id: number) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart hors de CartProvider");
  return c;
}
