import Link from "next/link";
import { notFound } from "next/navigation";
import { DICTS, isLang } from "@/lib/i18n";

export default async function PaymentFailed({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { n } = await searchParams;
  const number = typeof n === "string" && /^B514-\d+$/.test(n) ? n : null;
  const t = DICTS[lang];
  return (
    <div className="mx-auto flex max-w-md animate-fade-up flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-promo/10 text-3xl" aria-hidden>✕</span>
      <h1 className="font-display text-2xl font-bold text-brand-950">{t.paymentFailedTitle}</h1>
      {number && (
        <p className="text-sm text-gray-500">
          {t.orderNumber} : <strong dir="ltr">{number}</strong>
        </p>
      )}
      <p className="text-gray-600">{t.paymentFailedText}</p>
      <Link href={`/${lang}`} className="btn-primary mt-2">
        {t.retryOrder}
      </Link>
    </div>
  );
}
