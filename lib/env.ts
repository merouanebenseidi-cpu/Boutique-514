/** Valeur d'une variable sans espaces ni guillemets parasites (erreurs de copier-coller). */
export function cleanEnv(v: string | undefined) {
  return (v ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

/** SUPABASE_URL ramenée à https://xxxx.supabase.co, même si un chemin a été collé avec. */
export function supabaseUrl(): string | null {
  const raw = cleanEnv(process.env.SUPABASE_URL);
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.endsWith(".supabase.co") ? `https://${u.hostname}` : null;
  } catch {
    return null;
  }
}
