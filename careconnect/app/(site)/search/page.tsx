import { DoctorCard, type DoctorListItem } from "@/components/DoctorCard";

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string" && v.trim()) qs.set(k, v);
  }
  const res = await fetch(`${process.env.APP_BASE_URL || "http://localhost:3000"}/api/doctors?${qs.toString()}`, {
    cache: "no-store",
  });
  const data = await res.json();

  const items: DoctorListItem[] = data.items || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-xl font-semibold">Find a doctor</h1>
        <form className="mt-3 grid gap-3 md:grid-cols-6" method="get">
          <input className="rounded border px-3 py-2 md:col-span-2" name="q" placeholder="Name, clinic, keyword" defaultValue={(searchParams.q as string) || ""} />
          <input className="rounded border px-3 py-2" name="city" placeholder="City" defaultValue={(searchParams.city as string) || ""} />
          <input className="rounded border px-3 py-2" name="specialty" placeholder="Specialty slug (e.g. derm)" defaultValue={(searchParams.specialty as string) || ""} />
          <input className="rounded border px-3 py-2" name="lang" placeholder="Lang (fr/ar/en)" defaultValue={(searchParams.lang as string) || ""} />
          <button className="rounded bg-slate-900 px-4 py-2 text-white">Search</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Tip: you can add <code>lat</code>, <code>lng</code>, and <code>radiusKm</code> in the URL for near-me search.
        </p>
      </div>

      <div className="grid gap-3">
        {items.map((d) => (
          <DoctorCard key={d.id} d={d} />
        ))}
        {items.length === 0 ? <p className="text-sm text-slate-600">No results. Try another city/specialty.</p> : null}
      </div>
    </div>
  );
}
