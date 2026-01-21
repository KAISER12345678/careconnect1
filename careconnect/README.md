# CareConnect (MVP)

A healthcare discovery + scheduling platform (doctors + pharmacies) built with **Next.js App Router + Prisma + Postgres**.

## What’s included (MVP)
- Patient signup/login (email + password) with JWT cookie session
- Doctor search (filters: city, specialty slug, language, price) + “next available” (best effort)
- Doctor profile + booking (slot generation + conflict prevention)
- Patient dashboard: appointments + cancel + review after completion
- Pharmacy directory + profiles
- Provider dashboard (doctor): set weekly availability + manage appointments
- Admin dashboard: approve/reject providers + hide/unhide reviews
- Reminder job script (email or dry-run logging)
- Docker compose for Postgres
- Seed script with demo Morocco + France data

## Quick start

### 1) Start Postgres
```bash
docker compose up -d
```

### 2) Configure env
Copy:
```bash
cp .env.example .env
```
Edit `.env` if needed (especially `AUTH_JWT_SECRET`).

### 3) Install deps
```bash
npm install
```

### 4) Migrate + generate client
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5) Seed demo data
```bash
npm run seed
```

### 6) Run app
```bash
npm run dev
```

Open: http://localhost:3000

## Demo accounts
Seed prints credentials, but defaults are:
- Admin: `admin@careconnect.local` / `admin12345`
- Seeded providers: `provider12345` (emails visible in seed script)
- Create patient accounts from `/account`

## Reminders (optional)
Dry-run (logs) unless SMTP vars are set in `.env`:
```bash
npm run reminders
```

## Notes / Limitations (MVP)
- Teleconsultation video not included (placeholder only)
- No online payments (can be added later)
- Pharmacy inventory is not real-time (directory only)
- Timezones: MVP uses `APP_TZ_OFFSET_MINUTES` for slot generation (set per deployment)
- Legal/compliance: production rollout requires country-specific legal review for healthcare listings and data handling

## Next improvements
- Proper map UI (Mapbox/Google) with clustering
- PostGIS radius search
- Provider self-onboarding + verification uploads
- WhatsApp/SMS reminders integration
- Multi-language UI (FR/AR)
- Payments and invoices
