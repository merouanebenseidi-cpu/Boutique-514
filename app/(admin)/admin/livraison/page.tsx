import { requireAdmin } from "@/lib/auth";
import { listShippingRates } from "@/lib/catalog";
import { saveShippingRates } from "../actions";
import { AddWilayaForm } from "./AddWilayaForm";

export default async function ShippingAdmin() {
  await requireAdmin();
  const rates = await listShippingRates(true);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tarifs de livraison</h1>
      <p className="text-sm text-gray-600">
        Les tarifs de départ sont indicatifs : remplace-les par ceux de ton transporteur. Mets 0 pour la livraison gratuite.
        Décoche « Active » pour ne plus livrer une wilaya.
      </p>

      <form action={saveShippingRates} className="space-y-4">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-start">Wilaya</th>
                <th className="p-2 text-start">Domicile (DA)</th>
                <th className="p-2 text-start">Bureau / stop desk (DA)</th>
                <th className="p-2 text-start">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((r) => (
                <tr key={r.code}>
                  <td className="whitespace-nowrap p-2">
                    <input type="hidden" name="code" value={r.code} />
                    {String(r.code).padStart(2, "0")} - {r.name_fr}
                  </td>
                  <td className="p-2">
                    <input name={`home_${r.code}`} defaultValue={r.price_home} inputMode="numeric" className="input w-28 py-1.5" />
                  </td>
                  <td className="p-2">
                    <input name={`desk_${r.code}`} defaultValue={r.price_desk} inputMode="numeric" className="input w-28 py-1.5" />
                  </td>
                  <td className="p-2">
                    <input type="checkbox" name={`active_${r.code}`} defaultChecked={r.active} className="size-4 accent-brand-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-primary sticky bottom-4 px-8 shadow-lg">Enregistrer les tarifs</button>
      </form>

      <AddWilayaForm />
    </div>
  );
}
