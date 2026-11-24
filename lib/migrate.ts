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
      const sql = db();
      await sql`alter table products add column if not exists promo_ends_at timestamptz`;
      // Plusieurs photos par produit : la première est aussi recopiée dans image_url.
      await sql`alter table products add column if not exists images text[] not null default '{}'`;
      await sql`update products set images = array[image_url] where image_url <> '' and cardinality(images) = 0`;
    })().catch((e) => {
      done = null; // réessaiera au prochain appel
      throw e;
    });
  }
  return done;
}
