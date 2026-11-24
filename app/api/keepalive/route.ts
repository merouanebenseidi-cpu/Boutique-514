import { db } from "@/lib/db";
import { cleanEnv } from "@/lib/env";
import { cancelStaleOnlineOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Appelée une fois par jour par Vercel (voir vercel.json) : une petite requête
 * suffit à garder le projet Supabase gratuit actif (il se met en pause après
 * une semaine sans activité).
 */
export async function GET(req: Request) {
  const secret = cleanEnv(process.env.CRON_SECRET);
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  try {
    await db()`select 1`;
    // Paiements en ligne commencés mais jamais terminés : annulés après 24 h (stock remis).
    const cancelled = await cancelStaleOnlineOrders(24);
    return Response.json({ ok: true, cancelled, at: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
