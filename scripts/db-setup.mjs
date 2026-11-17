// Crée les tables, remplit les wilayas et (sur Supabase) le bucket des photos.
// Usage : DATABASE_URL=... npm run db:setup      (ajoute --demo pour des produits d'exemple)
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";
import { WILAYAS } from "../db/wilayas.mjs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (voir .env.example).");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("✓ Tables prêtes");

  for (const w of WILAYAS) {
    await sql`
      insert into shipping_rates ${sql(w, "code", "name_fr", "name_ar", "price_home", "price_desk")}
      on conflict (code) do nothing`;
  }
  console.log(`✓ ${WILAYAS.length} wilayas (les tarifs existants ne sont pas écrasés)`);

  const [{ exists }] = await sql`
    select exists (select 1 from information_schema.tables
                   where table_schema = 'storage' and table_name = 'buckets') as exists`;
  if (exists) {
    await sql`
      insert into storage.buckets (id, name, public) values ('produits', 'produits', true)
      on conflict (id) do nothing`;
    console.log("✓ Bucket de photos « produits » (Supabase Storage)");
  }

  if (process.argv.includes("--demo")) {
    const [{ count }] = await sql`select count(*)::int as count from products`;
    if (count === 0) {
      const demo = [
        ["Smartphone 128 Go", "هاتف ذكي 128 جيغا", "electronique", 42000, 48000, 5, true],
        ["Manette de jeu sans fil", "يد تحكم لاسلكية", "electronique", 9500, 11000, 8, false],
        ["Parfum 100 ml", "عطر 100 مل", "parfums", 7800, null, 12, true],
        ["Crème hydratante", "كريم مرطب", "beaute", 2400, 2900, 20, false],
        ["Vitamine C 1000 mg", "فيتامين سي 1000 ملغ", "complements", 1900, null, 30, false],
        ["Coffret de chocolats", "علبة شوكولاتة", "friandises", 3200, 3800, 15, true],
      ];
      for (const [name_fr, name_ar, category, price, compare_at_price, stock, featured] of demo) {
        await sql`insert into products ${sql({ name_fr, name_ar, category, price, compare_at_price, stock, featured })}`;
      }
      console.log(`✓ ${demo.length} produits d'exemple`);
    } else {
      console.log("• Des produits existent déjà : produits d'exemple non ajoutés");
    }
  }
} finally {
  await sql.end();
}
