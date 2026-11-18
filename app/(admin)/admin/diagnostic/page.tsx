import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import { cleanEnv, supabaseUrlInfo } from "@/lib/env";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean | null; detail: string };

/** Analyse DATABASE_URL sans jamais afficher le mot de passe. */
function inspectDatabaseUrl(raw: string | undefined): Check[] {
  if (!raw?.trim()) return [{ label: "DATABASE_URL", ok: false, detail: "Variable absente." }];
  const checks: Check[] = [];
  const v = raw.trim();
  if (v !== raw) checks.push({ label: "Espaces", ok: false, detail: "Il y a des espaces au début ou à la fin de l'adresse." });
  if (/^["']|["']$/.test(v)) checks.push({ label: "Guillemets", ok: false, detail: "Retire les guillemets autour de l'adresse." });
  if (v.includes("[") || v.includes("]"))
    checks.push({ label: "Crochets", ok: false, detail: "L'adresse contient [ ou ] : remplace [YOUR-PASSWORD] crochets compris par le mot de passe." });
  if ((v.match(/@/g) ?? []).length > 1)
    checks.push({ label: "Caractère @", ok: false, detail: "Le mot de passe contient un @ : change-le dans Supabase (lettres et chiffres uniquement)." });

  let u: URL | null = null;
  try {
    u = new URL(v.replace(/^["']|["']$/g, ""));
  } catch {
    checks.push({ label: "Format", ok: false, detail: "Adresse illisible. Elle doit commencer par postgresql:// ." });
    return checks;
  }
  checks.push({
    label: "Début de l'adresse",
    ok: u.protocol === "postgresql:" || u.protocol === "postgres:",
    detail: u.protocol,
  });
  checks.push({
    label: "Serveur",
    ok: u.hostname.endsWith("pooler.supabase.com"),
    detail: u.hostname.endsWith("pooler.supabase.com")
      ? u.hostname
      : `${u.hostname || "(vide)"} : il faut l'adresse « Transaction pooler » (…pooler.supabase.com).`,
  });
  checks.push({
    label: "Port",
    ok: u.port === "6543",
    detail: u.port === "6543" ? "6543" : `${u.port || "(aucun)"} : il faut le port 6543 (Transaction pooler).`,
  });
  checks.push({
    label: "Utilisateur",
    ok: u.username.startsWith("postgres."),
    detail: u.username.startsWith("postgres.") ? u.username : `${u.username || "(vide)"} : doit être postgres.<id du projet>.`,
  });
  checks.push({
    label: "Mot de passe",
    ok: u.password.length > 0 && !/YOUR-PASSWORD/i.test(u.password),
    detail: u.password.length === 0 ? "Absent." : /YOUR-PASSWORD/i.test(u.password) ? "Encore [YOUR-PASSWORD] : à remplacer." : `présent (${u.password.length} caractères)`,
  });
  return checks;
}

async function testDatabase(): Promise<Check[]> {
  const url = cleanEnv(process.env.DATABASE_URL);
  if (!url) return [];
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 8, idle_timeout: 1, onnotice: () => {} });
  try {
    await sql`select 1`;
    const tables = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name in ('products','orders','order_items','shipping_rates')`;
    const names = tables.map((t) => t.table_name);
    const missing = ["products", "orders", "order_items", "shipping_rates"].filter((n) => !names.includes(n));
    const out: Check[] = [{ label: "Connexion à la base", ok: true, detail: "OK" }];
    out.push({
      label: "Tables",
      ok: missing.length === 0,
      detail: missing.length === 0 ? "Toutes présentes" : `Manquantes : ${missing.join(", ")} : relance db/supabase-setup.sql dans Supabase.`,
    });
    if (missing.length === 0) {
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from shipping_rates`;
      out.push({ label: "Wilayas", ok: n > 0, detail: `${n} wilayas` });
    }
    return out;
  } catch (e) {
    const msg = (e as Error).message;
    let hint = "";
    if (/password authentication failed/i.test(msg)) hint = " → Mot de passe incorrect : réinitialise-le dans Supabase et mets à jour DATABASE_URL.";
    else if (/tenant|user not found/i.test(msg))
      hint = " → Le serveur (partie entre @ et :6543) ne correspond pas à ton projet : recopie l'adresse exacte depuis Supabase (Connect → Direct → Transaction pooler), sans la retaper.";
    else if (/ENOTFOUND|getaddrinfo/i.test(msg)) hint = " → Serveur introuvable : adresse mal copiée.";
    else if (/timeout|ETIMEDOUT/i.test(msg)) hint = " → Pas de réponse : vérifie que le projet Supabase n'est pas en pause.";
    return [{ label: "Connexion à la base", ok: false, detail: msg + hint }];
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}

async function testStorage(): Promise<Check[]> {
  const info = supabaseUrlInfo();
  const url = info?.url;
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) return [{ label: "Stockage des photos", ok: null, detail: "Non configuré (facultatif : l'admin acceptera seulement des liens d'image)." }];
  if (!url) return [{ label: "SUPABASE_URL", ok: false, detail: "Adresse non reconnue : elle doit ressembler à https://xxxx.supabase.co" }];
  const urlCheck: Check = {
    label: "Adresse du projet",
    ok: true,
    detail: info!.source === "SUPABASE_URL" ? url : `${url} (déduite de DATABASE_URL, SUPABASE_URL étant illisible)`,
  };
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.getBucket("produits");
    if (error) {
      return [urlCheck, { label: "Stockage des photos", ok: false, detail: `${error.message} → vérifie la clé secrète (secret / service_role, pas anon) et relance db/supabase-setup.sql.` }];
    }
    return [urlCheck, { label: "Stockage des photos", ok: Boolean(data?.public), detail: data?.public ? "Bucket « produits » OK" : "Le bucket « produits » n'est pas public." }];
  } catch (e) {
    return [{ label: "Stockage des photos", ok: false, detail: (e as Error).message }];
  }
}

export default async function Diagnostic() {
  await requireAdmin();
  const env: Check[] = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
    "NEXT_PUBLIC_SHOP_NAME",
    "NEXT_PUBLIC_WHATSAPP",
  ].map((k) => ({ label: k, ok: process.env[k] ? true : k.startsWith("NEXT_PUBLIC") ? null : false, detail: process.env[k] ? "définie" : "absente" }));

  const sections: [string, Check[]][] = [
    ["Variables", env],
    ["Adresse de la base (DATABASE_URL)", inspectDatabaseUrl(process.env.DATABASE_URL)],
    ["Test de la base", await testDatabase()],
    ["Photos", await testStorage()],
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Diagnostic</h1>
      <p className="text-sm text-gray-600">Les mots de passe et clés ne sont jamais affichés ici.</p>
      {sections.map(([title, checks]) => (
        <section key={title} className="card p-4">
          <h2 className="mb-2 font-semibold">{title}</h2>
          <ul className="space-y-1.5 text-sm">
            {checks.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>{c.ok === null ? "➖" : c.ok ? "✅" : "❌"}</span>
                <span>
                  <strong>{c.label}</strong> : <span className="break-all">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
