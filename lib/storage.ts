import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const BUCKET = "produits";
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function storageEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Envoie la photo dans Supabase Storage et renvoie son URL publique. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!storageEnabled()) throw new Error("Stockage des photos non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Format d'image non accepté (JPG, PNG, WebP ou AVIF).");
  if (file.size > 4 * 1024 * 1024) throw new Error("Image trop lourde (4 Mo maximum).");

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Échec de l'envoi de la photo : ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
