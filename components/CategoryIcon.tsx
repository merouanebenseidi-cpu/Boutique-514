import { Candy, Gamepad2, Package, Pill, Sparkles, SprayCan, type LucideProps } from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  electronique: Gamepad2,
  beaute: Sparkles,
  parfums: SprayCan,
  complements: Pill,
  friandises: Candy,
  autres: Package,
};

export function CategoryIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon aria-hidden strokeWidth={1.75} {...props} />;
}
