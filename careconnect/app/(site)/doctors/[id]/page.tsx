import { BookingWidget } from "@/components/BookingWidget";

export default async function DoctorPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.APP_BASE_URL || "http://localhost:3000"}/api/doctors/${params.id}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    return <div className="rounded-2xl border p-4">Doctor not found.</div>;
  }
  const d = data.doctor;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <div className="rounded-2xl border p-4">
          <h1 className="text-2xl font-semibold">{d.name}</h1>
          <p className="mt-1 text-slate-600">{d.specialties.map((s: any) => s.name).join(" • ")}</p>
          <p className="mt-2 text-sm text-slate-600">{d.city} • {d.address}</p>
          <p className="mt-1 text-sm text-slate-600">Languages: {d.languages.join(", ") || "—"}</p>
          <p className="mt-1 text-sm text-slate-600">Starting from: <span className="font-semibold">{d.priceMin} {d.currency}</span></p>
          <p className="mt-2 text-sm text-slate-600">
            Rating: {d.avgRating ? `${Number(d.avgRating).toFixed(1)} ★` : "No rating"} {d.ratingCount ? `(${d.ratingCount})` : ""}
          </p>
          {d.bio ? <p className="mt-3 text-slate-700">{d.bio}</p> : null}
          <div className="mt-3 flex gap-2">
            <a className="rounded border px-3 py-1 no-underline hover:bg-slate-50" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${encodeURIComponent(`${d.lat},${d.lng}`)}`}>
              Open in Maps
            </a>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">Recent reviews</h2>
          <div className="mt-3 space-y-3">
            {d.reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{r.patientName}</div>
                  <div>{r.rating} ★</div>
                </div>
                <div className="mt-1 text-sm text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</div>
                <p className="mt-2 text-sm">{r.text}</p>
              </div>
            ))}
            {d.reviews.length === 0 ? <p className="text-sm text-slate-600">No reviews yet.</p> : null}
          </div>
        </div>
      </div>

      <div className="md:col-span-1">
        <BookingWidget doctorId={params.id} />
        <div className="mt-4 rounded-2xl border p-4">
          <h3 className="font-semibold">Reminder system</h3>
          <p className="mt-1 text-sm text-slate-600">
            Automated reminders are handled by a scheduled job (see <code>scripts/run-reminders.mjs</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
