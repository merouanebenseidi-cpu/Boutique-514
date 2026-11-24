import "server-only";
import { db } from "./db";

/**
 * Petites évolutions du schéma appliquées automatiquement au premier accès,
 * pour ne pas avoir à relancer de script SQL dans Supabase.
 */
let done: Promise<void> | null = null;

export function ensureSchema() {
  if (!done) {
    done = (async () => {
      await db()`alter table products add column if not exists promo_ends_at timestamptz`;
    })().catch((e) => {
      done = null; // réessaiera au prochain appel
      throw e;
    });
  }
  return done;
}
