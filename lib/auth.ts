import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || "";
  if (s.length < 16) throw new Error("ADMIN_SESSION_SECRET manquant ou trop court (16 caractères minimum).");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (expected.length < 8) return false; // refuse les mots de passe vides ou trop faibles
  // Compare des empreintes de taille fixe pour ne pas révéler la longueur.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${expected}`));
}

export async function createSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const store = await cookies();
  store.set(COOKIE, `${exp}.${sign(String(exp))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}

/** À appeler en tête de chaque page et action admin. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
