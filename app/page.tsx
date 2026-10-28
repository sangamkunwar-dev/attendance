import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">School RFID Attendance System</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Track attendance across multiple classes with ESP32 RFID scanners, live device status, and CSV exports.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className="rounded bg-slate-900 px-4 py-2 text-white">
          Create Admin Account
        </Link>
        <Link href="/login" className="rounded border px-4 py-2">
          Admin Login
        </Link>
        <Link href="/student/login" className="rounded border px-4 py-2">
          Student Login
        </Link>
      </div>
    </main>
  );
}
