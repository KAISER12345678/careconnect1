import { verifySession } from "@/lib/auth";
import { AuthForms } from "@/components/AuthForms";
import { PatientAppointments } from "@/components/PatientAppointments";

export default async function AccountPage() {
  const me = verifySession();

  if (!me) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h1 className="text-2xl font-semibold">Your account</h1>
          <p className="mt-2 text-slate-600">
            Login to book appointments, manage reminders, and leave reviews after visits.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Providers can request a listing via the seed script for now (MVP). Admin can approve providers.
          </p>
        </div>
        <AuthForms />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-2xl font-semibold">Welcome, {me.name}</h1>
        <p className="mt-1 text-slate-600">Role: {me.role}</p>
      </div>

      {me.role === "PATIENT" ? (
        <div className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">Your appointments</h2>
          <div className="mt-3">
            <PatientAppointments />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border p-4">
          <p className="text-slate-600">Go to your Provider dashboard.</p>
        </div>
      )}
    </div>
  );
}
