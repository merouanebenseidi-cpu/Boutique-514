"use client";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="text-5xl" aria-hidden>⚠️</span>
      <p className="font-semibold">Le site est momentanément indisponible.</p>
      <p className="font-semibold" dir="rtl">الموقع غير متاح مؤقتًا.</p>
      <button onClick={reset} className="btn-primary">Réessayer · حاول مجددًا</button>
    </div>
  );
}
