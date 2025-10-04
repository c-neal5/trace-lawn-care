
# Ace's Lawn Care — Demo Backend (Retell + Vercel)

This is a **safe demo** backend for your Retell agent. No real Google Calendar or SMS calls.
It returns **mock availability**, **fake bookings**, and a **no-op owner notify** endpoint.
Optionally supports **Vercel KV** for customer memory in the demo.

## Endpoints
- `POST /api/availability.search` — returns 3 nice-looking slots (mock).
- `POST /api/booking.create` — "confirms" a booking with a fake `booking_id` and logs the owner SMS.
- `POST /api/owner.notify` — logs the message that would be sent to Ace.
- `POST /api/memory.get` — (optional) fetch demo customer profile from KV.
- `POST /api/memory.upsert` — (optional) upsert demo customer profile in KV.
- `GET  /api/demo.seed` — (optional) preload 2 fake customer profiles.
- `GET  /api/demo.reset` — (optional) clear the 2 fake profiles.

## Quick Start (Local folder -> GitHub -> Vercel)
1) **Unzip** this folder somewhere on your Mac.
2) In Terminal, `cd` into the folder and run:
   ```bash
   npm install
   ```
3) Create a new GitHub repo (or use yours), then:
   ```bash
   git init
   git add .
   git commit -m "initial demo backend"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```
4) In **Vercel**, click **New Project** → import your repo.
5) Add Environment Variables (for demo you only need):
   - `TIMEZONE = America/Chicago`
   - (optional memory) KV env vars from Vercel → Storage → KV
6) Deploy. You'll get a domain like: `https://<your-app>.vercel.app`

## Retell Tool URLs (set Method = POST)
- `availability_search` → `https://<your-app>.vercel.app/api/availability.search`
- `booking_create`      → `https://<your-app>.vercel.app/api/booking.create`
- `owner_notify`        → `https://<your-app>.vercel.app/api/owner.notify`
- (optional) `memory_get`   → `/api/memory.get`
- (optional) `memory_upsert`→ `/api/memory.upsert`

## Notes
- This is DEMO ONLY. In production, swap these endpoints for ones that hit Google Calendar and Twilio.
