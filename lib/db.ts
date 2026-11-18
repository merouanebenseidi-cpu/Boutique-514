import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant : configure la base de données (voir README).");
  // prepare:false est requis avec le « transaction pooler » de Supabase.
  return postgres(url.trim(), { prepare: false, max: 5, idle_timeout: 20 });
}

export function db() {
  if (!globalThis.__sql) globalThis.__sql = create();
  return globalThis.__sql;
}
