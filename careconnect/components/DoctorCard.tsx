import Link from "next/link";

export type DoctorListItem = {
  id: string;
  name: string;
  clinicName?: string | null;
  city: string;
  address: string;
  lat: number;
  lng: number;
  priceMin: number;
  currency: string;
  avgRating: number | null;
  ratingCount: number;
  distanceKm: number | null;
  nextAvailable: string | null;
  specialties: { name: string; slug: string }[];
  languages: string[];
};

export function DoctorCard({ d }: { d: DoctorListItem }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link className="text-lg font-semibold no-underline" href={`/doctors/${d.id}`}>
            {d.name}
          </Link>
          <div className="text-sm text-slate-600">{d.specialties.map((s) => s.name).join(" • ")}</div>
          <div className="mt-1 text-sm text-slate-600">{d.city} • {d.address}</div>
          <div className="mt-1 text-sm text-slate-600">Languages: {d.languages.join(", ") || "—"}</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{d.priceMin} {d.currency}</div>
          <div className="text-slate-600">
            {d.avgRating ? `${d.avgRating.toFixed(1)} ★` : "No rating"} {d.ratingCount ? `(${d.ratingCount})` : ""}
          </div>
          {d.distanceKm != null ? <div className="text-slate-600">{d.distanceKm.toFixed(1)} km</div> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          Next: {d.nextAvailable ? new Date(d.nextAvailable).toLocaleString() : "—"}
        </div>
        <div className="flex gap-2">
          <a
            className="rounded border px-3 py-1 no-underline hover:bg-slate-50"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps?q=${encodeURIComponent(`${d.lat},${d.lng}`)}`}
          >
            Open in Maps
          </a>
          <Link className="rounded bg-slate-900 px-3 py-1 text-white no-underline" href={`/doctors/${d.id}`}>
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}
