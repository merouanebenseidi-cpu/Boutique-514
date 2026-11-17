import "../../globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Boutique 514", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const logged = await isAdmin();
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans antialiased">
        {logged && (
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="font-extrabold text-brand-700">Admin</span>
              <nav className="flex flex-wrap gap-1 text-sm">
                <Link className="rounded-lg px-3 py-1.5 hover:bg-gray-100" href="/admin/commandes">Commandes</Link>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-gray-100" href="/admin/produits">Produits</Link>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-gray-100" href="/admin/livraison">Livraison</Link>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-gray-100" href="/fr" target="_blank">Voir le site ↗</Link>
              </nav>
              <form action={logout} className="ms-auto">
                <button className="text-sm text-gray-600 underline">Déconnexion</button>
              </form>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
