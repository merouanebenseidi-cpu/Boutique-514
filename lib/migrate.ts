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
      // Référence du paiement en ligne (identifiant du paiement Chargily).
      await sql`alter table orders add column if not exists payment_ref text`;
      await sql`create index if not exists orders_payment_ref_idx on orders (payment_ref)`;
      // 11 nouvelles wilayas (loi n° 26-06 du 4 avril 2026) ; les tarifs déjà saisis ne sont pas modifiés.
      await sql.unsafe(`insert into shipping_rates (code, name_fr, name_ar, price_home, price_desk) values
          (59, 'Aflou', 'آفلو', 800, 500),
          (60, 'Barika', 'بريكة', 600, 400),
          (61, 'El Kantara', 'القنطرة', 600, 400),
          (62, 'Bir El Ater', 'بئر العاتر', 600, 400),
          (63, 'El Aricha', 'العريشة', 800, 500),
          (64, 'Ksar Chellala', 'قصر الشلالة', 800, 500),
          (65, 'Aïn Oussara', 'عين وسارة', 800, 500),
          (66, 'Messaad', 'مسعد', 800, 500),
          (67, 'Ksar El Boukhari', 'قصر البخاري', 600, 400),
          (68, 'Bou Saâda', 'بوسعادة', 800, 500),
          (69, 'El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ', 1000, 700)
        on conflict (code) do nothing`);
      await sql`update products set images = array[image_url] where image_url <> '' and cardinality(images) = 0`;
    })().catch((e) => {
      done = null; // réessaiera au prochain appel
      throw e;
    });
  }
  return done;
}
