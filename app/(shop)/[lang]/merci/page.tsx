import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DICTS, isLang } from "@/lib/i18n";
import { ensureSchema } from "@/lib/migrate";

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ n?: string; paiement?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { n, paiement } = await searchParams;
  const number = typeof n === "string" && /^B514-\d+$/.test(n) ? n : null;
  const t = DICTS[lang];

  // Retour de la page de paiement : l'état réel vient de la notification Chargily, pas de l'adresse.
  let paid: boolean | null = null;
  if (number && paiement) {
    try {
      await ensureSchema();
      const [o] = await db()<{ payment_status: string }[]>`select payment_status from orders where number = ${number}`;
      paid = o?.payment_status === "paid";
    } catch {
      paid = null;
    }
  }

  return (
    <div className="mx-auto flex max-w-md animate-fade-up flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-3xl text-brand-700" aria-hidden>
        ✓
      </span>
      <h1 className="font-display text-2xl font-bold text-brand-950">{t.thanks}</h1>
      {number && (
        <p>
          {t.orderNumber} : <strong dir="ltr">{number}</strong>
        </p>
      )}
      {paiement &&
        (paid ? (
          <p className="rounded-full bg-brand-100 px-4 py-1.5 font-semibold text-brand-700">{t.paymentConfirmed}</p>
        ) : (
          <p className="text-sm text-gray-500">{t.paymentPending}</p>
        ))}
      <p className="text-gray-600">{t.thanksText}</p>
      <Link href={`/${lang}`} className="btn-primary mt-4">
        {t.backHome}
      </Link>
    </div>
  );
}
