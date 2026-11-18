"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminPasswordConfigured, checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/i18n";
import { setOrderStatus } from "@/lib/orders";
import { storageEnabled, uploadProductImage } from "@/lib/storage";
import { ORDER_STATUSES } from "@/lib/types";

// ---------- Connexion ----------

export async function login(_: string | null, form: FormData): Promise<string | null> {
  // Petit délai fixe : ralentit les essais de mot de passe à la chaîne.
  await new Promise((r) => setTimeout(r, 600));
  if (!adminPasswordConfigured()) {
    return "ADMIN_PASSWORD n'est pas configuré ou fait moins de 8 caractères : corrige-le dans les variables d'environnement puis relance une mise en ligne.";
  }
  if (!checkPassword(String(form.get("password") ?? ""))) return "Mot de passe incorrect.";
  await createSession();
  redirect("/admin/commandes");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------- Produits ----------

const intOrNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/\s/g, ""))),
  z.number().int().min(0).nullable(),
);

const ProductSchema = z.object({
  name_fr: z.string().trim().min(1, "Le nom en français est obligatoire.").max(200),
  name_ar: z.string().trim().max(200),
  description_fr: z.string().trim().max(5000),
  description_ar: z.string().trim().max(5000),
  category: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]], "Catégorie invalide."),
  price: z.preprocess((v) => Number(String(v).replace(/\s/g, "")), z.number("Prix invalide.").int("Prix invalide.").min(0)),
  compare_at_price: intOrNull,
  stock: z.preprocess((v) => Number(String(v || 0).replace(/\s/g, "")), z.number().int().min(0, "Stock invalide.")),
  image_url: z.string().trim().max(1000),
  active: z.boolean(),
  featured: z.boolean(),
});

export async function saveProduct(_: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const id = Number(form.get("id") || 0);

  const parsed = ProductSchema.safeParse({
    name_fr: form.get("name_fr") ?? "",
    name_ar: form.get("name_ar") ?? "",
    description_fr: form.get("description_fr") ?? "",
    description_ar: form.get("description_ar") ?? "",
    category: form.get("category"),
    price: form.get("price"),
    compare_at_price: form.get("compare_at_price"),
    stock: form.get("stock"),
    image_url: form.get("image_url") ?? "",
    active: form.get("active") === "on",
    featured: form.get("featured") === "on",
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Formulaire invalide.";
  const data = parsed.data;

  if (data.image_url && !/^https:\/\//.test(data.image_url)) return "Le lien de l'image doit commencer par https://";
  if (data.compare_at_price !== null && data.compare_at_price <= data.price) {
    return "Le prix barré doit être supérieur au prix de vente (ou laissé vide).";
  }

  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!storageEnabled()) return "L'envoi de photos n'est pas configuré : colle plutôt un lien d'image.";
    try {
      data.image_url = await uploadProductImage(file);
    } catch (e) {
      console.error("uploadProductImage", e);
      return `Photo : ${(e as Error).message}`;
    }
  }

  try {
    const sql = db();
    if (id > 0) {
      await sql`update products set ${sql(data)}, updated_at = now() where id = ${id}`;
    } else {
      await sql`insert into products ${sql(data)}`;
    }
  } catch (e) {
    console.error("saveProduct", e);
    return `Enregistrement impossible : ${(e as Error).message}`;
  }
  revalidatePath("/", "layout");
  return "ok";
}

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const field = form.get("field") === "featured" ? "featured" : "active";
  const sql = db();
  await sql`update products set ${sql(field)} = not ${sql(field)}, updated_at = now() where id = ${id}`;
  revalidatePath("/", "layout");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  // Les lignes de commandes passées gardent le nom et le prix (product_id passe à null).
  await db()`delete from products where id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

// ---------- Commandes ----------

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const status = String(form.get("status"));
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;
  await setOrderStatus(id, status);
  revalidatePath("/admin", "layout");
}

// ---------- Livraison ----------

export async function saveShippingRates(form: FormData) {
  await requireAdmin();
  const sql = db();
  const codes = form.getAll("code").map(Number);
  await sql.begin(async (tx) => {
    for (const code of codes) {
      const home = Number(form.get(`home_${code}`));
      const desk = Number(form.get(`desk_${code}`));
      if (!Number.isInteger(home) || !Number.isInteger(desk) || home < 0 || desk < 0) continue;
      const active = form.get(`active_${code}`) === "on";
      await tx`update shipping_rates set price_home = ${home}, price_desk = ${desk}, active = ${active} where code = ${code}`;
    }
  });
  revalidatePath("/", "layout");
}

export async function addWilaya(_: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const code = Number(form.get("code"));
  const name_fr = String(form.get("name_fr") ?? "").trim();
  const name_ar = String(form.get("name_ar") ?? "").trim();
  const price_home = Number(form.get("price_home"));
  const price_desk = Number(form.get("price_desk"));
  if (!Number.isInteger(code) || code <= 0 || !name_fr || !name_ar) return "Code, nom français et nom arabe obligatoires.";
  if (!Number.isInteger(price_home) || !Number.isInteger(price_desk) || price_home < 0 || price_desk < 0) return "Tarifs invalides.";
  const res = await db()`
    insert into shipping_rates (code, name_fr, name_ar, price_home, price_desk)
    values (${code}, ${name_fr}, ${name_ar}, ${price_home}, ${price_desk})
    on conflict (code) do nothing`;
  if (res.count === 0) return `La wilaya ${code} existe déjà.`;
  revalidatePath("/", "layout");
  return null;
}
