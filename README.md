# RFID Attendance System (Next.js + Supabase)

Production-ready multi-class school RFID attendance platform for ESP32 devices.

## Stack
- Next.js App Router + React + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + RLS + Auth)
- Lucide React

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. In Supabase SQL editor, run:
   - `/home/runner/work/attendance/attendance/supabase/schema.sql`
4. Start development server:
   ```bash
   npm run dev
   ```

## Production Deployment (Vercel + Supabase)

1. Create a production Supabase project.
2. In Supabase SQL Editor, run:
   - `/home/runner/work/attendance/attendance/supabase/schema.sql`
3. Copy these Supabase project keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Push this repository to GitHub (if not already pushed).
5. Deploy on Vercel:
   - Create a new project and import `sangamkunwar-dev/attendance`
   - Keep framework as Next.js
   - Add the 3 environment variables above in Vercel Project Settings
   - Deploy
6. Configure Supabase Auth URLs:
   - Supabase Dashboard -> Auth -> URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs:
     - `https://your-app.vercel.app/login`
     - `https://your-app.vercel.app/signup`
     - `https://your-app.vercel.app/student/login`
7. Point ESP32 firmware requests to:
   - `https://your-app.vercel.app/api/esp/attendance`
   - Use the per-class `device_token` generated in dashboard.

### Post-Deployment Smoke Test

1. Create an admin account (`/signup`).
2. Complete onboarding.
3. Create a class and copy its `device_token`.
4. Send a test POST request:
   ```bash
   curl -X POST https://your-app.vercel.app/api/esp/attendance \
     -H "Content-Type: application/json" \
     -d '{"device_token":"<CLASS_DEVICE_TOKEN>","card_uid":"<RFID_UID>"}'
   ```
5. Verify attendance appears in `/dashboard/attendance`.
6. Verify CSV export works from `/dashboard/attendance`.

### Fix for Vercel `404 NOT_FOUND`

If Vercel shows:
- `This page doesn’t exist`
- `404 NOT_FOUND`

check these settings and redeploy:

1. **Project Root Directory**
   - Vercel Project Settings -> General -> Root Directory
   - Keep it as repository root (`.`), not a subfolder.
2. **Production Branch**
   - Vercel Project Settings -> Git -> Production Branch
   - Set to the branch that contains this Next.js app code, or merge your feature branch into that production branch first.
3. **Framework Preset**
   - Vercel Project Settings -> Build & Development Settings
   - Ensure Framework is **Next.js**.
4. **Environment Variables**
   - Confirm all 3 variables exist in Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
5. **Redeploy**
   - Trigger a fresh deployment from the latest commit.
   - Verify the deployment URL opens `/`, `/login`, and `/signup`.

## Implemented Routes
- `/signup`, `/login` for admin auth
- `/onboarding` (school name + class count first-login wizard)
- `/dashboard/classes-students`
- `/dashboard/esp32-status`
- `/dashboard/attendance` with CSV export
- `/student/login`, `/student/attendance`
- `POST /api/esp/attendance` for ESP32 attendance + heartbeat

## ESP32 API
`POST /api/esp/attendance`

Payload:
```json
{ "device_token": "...", "card_uid": "..." }
```

- Invalid token/inactive class -> `{"status":"denied","message":"Device Unauthorized"}`
- Unknown card -> `{"status":"denied","message":"Access Denied / Unknown Card"}`
- Success -> `{"status":"success","student_name":"...","message":"Attendance Recorded"}`
- Heartbeat ping (without `card_uid`) updates `last_seen_at` and returns success.
