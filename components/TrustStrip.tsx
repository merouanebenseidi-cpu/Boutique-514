import { Banknote, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { DICTS, type Lang } from "@/lib/i18n";
import { Reveal } from "./Reveal";

const ICONS = [Truck, Banknote, ShieldCheck, MessageCircle];

export function TrustStrip({ lang }: { lang: Lang }) {
  const t = DICTS[lang];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {t.trust.map(([title, text], i) => {
        const Icon = ICONS[i];
        return (
          <Reveal key={title} delay={i * 90}>
            <div className="card flex h-full items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-gold-300">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-brand-950">{title}</span>
                <span className="block text-xs text-gray-500">{text}</span>
              </span>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
