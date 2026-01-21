export default async function PharmacyPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.APP_BASE_URL || "http://localhost:3000"}/api/pharmacies/${params.id}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) return <div className="rounded-2xl border p-4">Pharmacy not found.</div>;
  const p = data.pharmacy;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-2xl font-semibold">{p.name}</h1>
        <p className="mt-1 text-slate-600">{p.city} • {p.address}</p>
        <p className="mt-2 text-sm text-slate-600">Hours: {p.hours || "—"}</p>
        <p className="mt-1 text-sm text-slate-600">Services: {p.services?.join(", ") || "—"}</p>

        <div className="mt-3 flex gap-2">
          {p.phone ? <a className="rounded border px-3 py-1 no-underline hover:bg-slate-50" href={`tel:${p.phone}`}>Call</a> : null}
          <a className="rounded border px-3 py-1 no-underline hover:bg-slate-50" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${encodeURIComponent(`${p.lat},${p.lng}`)}`}>Open in Maps</a>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Request an item (MVP)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Inventory is not real-time in MVP. Use the call button, or later enable WhatsApp/online requests.
        </p>
      </div>
    </div>
  );
}
