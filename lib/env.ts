/** Valeur d'une variable sans espaces ni guillemets parasites (erreurs de copier-coller). */
export function cleanEnv(v: string | undefined) {
  return (v ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

const REF = /^[a-z0-9]{15,30}$/;

/** Identifiant du projet Supabase trouvé dans SUPABASE_URL (adresse du projet ou du tableau de bord). */
function refFromSupabaseUrl(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.hostname.endsWith(".supabase.co")) {
      const ref = u.hostname.split(".")[0];
      return REF.test(ref) ? ref : null;
    }
    // Adresse du tableau de bord : https://supabase.com/dashboard/project/<ref>/...
    const m = u.pathname.match(/\/project\/([a-z0-9]+)/);
    return m && REF.test(m[1]) ? m[1] : null;
  } catch {
    return REF.test(raw) ? raw : null; // identifiant seul
  }
}

/** Identifiant du projet déduit de DATABASE_URL (utilisateur « postgres.<ref> » ou serveur db.<ref>.supabase.co). */
function refFromDatabaseUrl(): string | null {
  try {
    const u = new URL(cleanEnv(process.env.DATABASE_URL));
    const fromUser = u.username.match(/^postgres\.([a-z0-9]+)$/)?.[1];
    if (fromUser && REF.test(fromUser)) return fromUser;
    const fromHost = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
    return fromHost && REF.test(fromHost) ? fromHost : null;
  } catch {
    return null;
  }
}

/** Adresse https://<ref>.supabase.co, ou null si elle ne peut pas être déterminée. */
export function supabaseUrlInfo(): { url: string; source: "SUPABASE_URL" | "DATABASE_URL" } | null {
  const raw = cleanEnv(process.env.SUPABASE_URL);
  const ref = raw ? refFromSupabaseUrl(raw) : null;
  if (ref) return { url: `https://${ref}.supabase.co`, source: "SUPABASE_URL" };
  const dbRef = refFromDatabaseUrl();
  return dbRef ? { url: `https://${dbRef}.supabase.co`, source: "DATABASE_URL" } : null;
}

export function supabaseUrl(): string | null {
  return supabaseUrlInfo()?.url ?? null;
}
