import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Find and book doctors — fast.</h1>
        <p className="mt-2 text-slate-600">
          Search by specialty, city, price, language and availability. View providers on a map, see reviews, and book
          appointments with reminders.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded bg-slate-900 px-4 py-2 text-white no-underline" href="/search">
            Search Doctors
          </Link>
          <Link className="rounded border px-4 py-2 no-underline" href="/pharmacies">
            Find Pharmacies
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">Disclaimer</h2>
        <p className="mt-2 text-slate-600">
          CareConnect does not provide medical advice, diagnosis, or treatment. It helps with discovery, scheduling, and
          admin organization only.
        </p>
      </div>
    </div>
  );
}
