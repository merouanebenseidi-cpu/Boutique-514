"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useCart } from "@/components/CartProvider";
import { DICTS, formatDA, type Lang } from "@/lib/i18n";
import type { CartProduct } from "@/lib/types";
import { getCartProducts, placeOrder } from "./actions";

type Rate = { code: number; name: string; home: number; desk: number };
type Payment = "cod" | "cib_edahabia" | "card_intl";

export function CheckoutClient({
  lang,
  rates,
  payments,
  gift,
}: {
  lang: Lang;
  rates: Rate[];
  payments: Payment[];
  gift: boolean;
}) {
  const t = DICTS[lang];
  const router = useRouter();
  const { lines, ready, setQty, remove, clear } = useCart();
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    wilaya_code: 0,
    commune: "",
    address: "",
    delivery_type: "home" as "home" | "desk",
    payment_method: "cod" as Payment,
    note: "",
    is_gift: false,
    sender_name: "",
    sender_email: "",
    sender_country: "",
    gift_message: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const idsKey = lines.map((l) => l.id).sort((a, b) => a - b).join(",");
  useEffect(() => {
    if (!ready) return;
    if (!idsKey) {
      setProducts([]);
      return;
    }
    let alive = true;
    getCartProducts(idsKey.split(",").map(Number), lang)
      .then((ps) => alive && setProducts(ps))
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, [idsKey, lang, ready]);

  // Retire du panier les produits supprimés ou masqués entre-temps.
  useEffect(() => {
    if (!products) return;
    const known = new Set(products.map((p) => p.id));
    lines.filter((l) => !known.has(l.id)).forEach((l) => remove(l.id));
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    if (!products) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return lines.flatMap((l) => {
      const p = byId.get(l.id);
      return p ? [{ ...p, qty: l.qty }] : [];
    });
  }, [lines, products]);

  const subtotal = rows.reduce((s, r) => s + r.price * r.qty, 0);
  const rate = rates.find((r) => r.code === form.wilaya_code);
  const shipping = rate ? (form.delivery_type === "home" ? rate.home : rate.desk) : null;
  const total = subtotal + (shipping ?? 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await placeOrder({
        ...form,
        lang,
        items: rows.map((r) => ({ id: r.id, qty: r.qty })),
      });
      if (res.ok) {
        clear();
        router.push(`/${lang}/merci?n=${encodeURIComponent(res.number)}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (!ready || products === null) {
    return <p className="py-16 text-center text-gray-500">…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden>🛒</span>
        <p className="text-gray-600">{t.emptyCart}</p>
        <Link href={`/${lang}`} className="btn-primary">
          {t.continueShopping}
        </Link>
      </div>
    );
  }

  const paymentLabel: Record<Payment, string> = { cod: t.cod, cib_edahabia: t.cibEdahabia, card_intl: t.cardIntl };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="order-2 space-y-5 lg:order-1">
        {gift && (
          <label className="card flex cursor-pointer items-start gap-3 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-brand-600"
              checked={form.is_gift}
              onChange={(e) => {
                set("is_gift", e.target.checked);
                set("payment_method", e.target.checked ? "card_intl" : "cod");
              }}
            />
            <span>
              <span className="font-semibold">🎁 {t.gift}</span>
              <span className="block text-sm text-gray-600">{t.giftHint}</span>
            </span>
          </label>
        )}

        {form.is_gift && (
          <fieldset className="card space-y-4 p-4">
            <legend className="px-1 font-semibold">{t.senderName}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.senderName}>
                <input className="input" required value={form.sender_name} onChange={(e) => set("sender_name", e.target.value)} />
              </Field>
              <Field label={t.senderEmail}>
                <input className="input" type="email" required value={form.sender_email} onChange={(e) => set("sender_email", e.target.value)} />
              </Field>
              <Field label={t.senderCountry}>
                <input className="input" value={form.sender_country} onChange={(e) => set("sender_country", e.target.value)} />
              </Field>
            </div>
            <Field label={t.giftMessage}>
              <textarea className="input" rows={2} value={form.gift_message} onChange={(e) => set("gift_message", e.target.value)} />
            </Field>
          </fieldset>
        )}

        <fieldset className="card space-y-4 p-4">
          <legend className="px-1 font-semibold">{form.is_gift ? t.recipient : t.yourInfo}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fullName}>
              <input className="input" required autoComplete="name" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
            </Field>
            <Field label={t.phone}>
              <input
                className="input"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder={t.phoneHint}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label={t.wilaya}>
              <select className="input" required value={form.wilaya_code || ""} onChange={(e) => set("wilaya_code", Number(e.target.value))}>
                <option value="" disabled>
                  {t.chooseWilaya}
                </option>
                {rates.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.commune}>
              <input className="input" required value={form.commune} onChange={(e) => set("commune", e.target.value)} />
            </Field>
          </div>

          <div>
            <span className="label">{t.deliveryType}</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["home", "desk"] as const).map((d) => (
                <label
                  key={d}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 ${form.delivery_type === d ? "border-brand-500 bg-brand-50" : "border-gray-300"}`}
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="delivery" className="accent-brand-600" checked={form.delivery_type === d} onChange={() => set("delivery_type", d)} />
                    {d === "home" ? t.home : t.desk}
                  </span>
                  {rate && <span className="text-sm font-semibold">{formatDA(d === "home" ? rate.home : rate.desk, lang)}</span>}
                </label>
              ))}
            </div>
          </div>

          {form.delivery_type === "home" && (
            <Field label={t.address}>
              <input className="input" required placeholder={t.addressHint} autoComplete="street-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          )}
          <Field label={t.note}>
            <textarea className="input" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="card space-y-2 p-4">
          <legend className="px-1 font-semibold">{t.payment}</legend>
          {payments
            .filter((m) => (form.is_gift ? m === "card_intl" : m !== "card_intl"))
            .map((m) => (
              <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${form.payment_method === m ? "border-brand-500 bg-brand-50" : "border-gray-300"}`}>
                <input type="radio" name="payment" className="mt-1 accent-brand-600" checked={form.payment_method === m} onChange={() => set("payment_method", m)} />
                <span>
                  <span className="font-medium">{paymentLabel[m]}</span>
                  {m === "cod" && <span className="block text-sm text-gray-600">{t.codHint}</span>}
                </span>
              </label>
            ))}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-promo">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3.5 text-lg" disabled={pending}>
          {pending ? t.sending : `${t.confirmOrder} · ${formatDA(total, lang)}`}
        </button>
      </form>

      <aside className="order-1 lg:order-2">
        <div className="card space-y-4 p-4 lg:sticky lg:top-32">
          <h1 className="text-lg font-bold">{t.cart}</h1>
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="flex gap-3 py-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl" aria-hidden>📦</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link href={`/${lang}/produit/${r.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
                    {r.name}
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-gray-300" dir="ltr">
                      <button type="button" className="px-2.5 py-1" aria-label="-" onClick={() => setQty(r.id, r.qty - 1)}>
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm" aria-label={t.quantity}>{r.qty}</span>
                      <button type="button" className="px-2.5 py-1 disabled:opacity-30" aria-label="+" disabled={r.qty >= r.stock} onClick={() => setQty(r.id, r.qty + 1)}>
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{formatDA(r.price * r.qty, lang)}</span>
                  </div>
                  {r.qty > r.stock && <span className="text-xs text-promo">{t.errors.stock}{r.stock}</span>}
                  <button type="button" className="self-start text-xs text-gray-500 underline" onClick={() => remove(r.id)}>
                    {t.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>{t.subtotal}</dt>
              <dd>{formatDA(subtotal, lang)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.shipping}</dt>
              <dd>{shipping === null ? <span className="text-gray-500">{t.chooseWilayaFirst}</span> : shipping === 0 ? t.free : formatDA(shipping, lang)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>{t.total}</dt>
              <dd className="text-brand-700">{formatDA(total, lang)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
