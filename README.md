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
