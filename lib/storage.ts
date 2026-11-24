import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { cleanEnv, supabaseUrl } from "./env";

const BUCKET = "produits";
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Crée l'espace de stockage public « produits » s'il n'existe pas encore. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureBucket(supabase: { storage: SupabaseClient<any, any, any>["storage"] }) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Création du stockage impossible : ${error.message}`);
}

export function storageEnabled() {
  return Boolean(supabaseUrl() && cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY));
}

/** Envoie la photo dans Supabase Storage et renvoie son URL publique. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!storageEnabled()) throw new Error("Stockage des photos non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Format d'image non accepté (JPG, PNG, WebP ou AVIF).");
  if (file.size > 4 * 1024 * 1024) throw new Error("Image trop lourde (4 Mo maximum).");

  const supabase = createClient(supabaseUrl()!, cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY), {
    auth: { persistSession: false },
  });
  await ensureBucket(supabase);
  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Échec de l'envoi de la photo : ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
