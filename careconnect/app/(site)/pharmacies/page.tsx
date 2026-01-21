export default async function PharmaciesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const qs = new URLSearchParams();
  if (typeof searchParams.city === "string" && searchParams.city) qs.set("city", searchParams.city);
  if (typeof searchParams.q === "string" && searchParams.q) qs.set("q", searchParams.q);

  const res = await fetch(`${process.env.APP_BASE_URL || "http://localhost:3000"}/api/pharmacies?${qs.toString()}`, { cache: "no-store" });
  const data = await res.json();
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-xl font-semibold">Find a pharmacy</h1>
        <form className="mt-3 grid gap-3 md:grid-cols-6" method="get">
          <input className="rounded border px-3 py-2 md:col-span-2" name="q" placeholder="Name or service keyword" defaultValue={(searchParams.q as string) || ""} />
          <input className="rounded border px-3 py-2" name="city" placeholder="City" defaultValue={(searchParams.city as string) || ""} />
          <button className="rounded bg-slate-900 px-4 py-2 text-white md:col-span-2">Search</button>
        </form>
      </div>

      <div className="grid gap-3">
        {items.map((p: any) => (
          <div key={p.id} className="rounded-2xl border p-4">
            <a className="text-lg font-semibold no-underline" href={`/pharmacies/${p.id}`}>{p.name}</a>
            <div className="mt-1 text-sm text-slate-600">{p.city} • {p.address}</div>
            <div className="mt-1 text-sm text-slate-600">Services: {p.services?.join(", ") || "—"}</div>
            <div className="mt-3 flex gap-2">
              {p.phone ? <a className="rounded border px-3 py-1 no-underline hover:bg-slate-50" href={`tel:${p.phone}`}>Call</a> : null}
              <a className="rounded border px-3 py-1 no-underline hover:bg-slate-50" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${encodeURIComponent(`${p.lat},${p.lng}`)}`}>Open in Maps</a>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-slate-600">No pharmacies found.</p> : null}
      </div>
    </div>
  );
}
