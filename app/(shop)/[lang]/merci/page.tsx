import Link from "next/link";
import { notFound } from "next/navigation";
import { DICTS, isLang } from "@/lib/i18n";

export default async function ThanksPage({
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="text-6xl" aria-hidden>✅</span>
      <h1 className="text-2xl font-bold">{t.thanks}</h1>
      {number && (
        <p>
          {t.orderNumber} : <strong dir="ltr">{number}</strong>
        </p>
      )}
      <p className="text-gray-600">{t.thanksText}</p>
      <Link href={`/${lang}`} className="btn-primary mt-4">
        {t.backHome}
      </Link>
    </div>
  );
}
