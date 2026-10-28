import Link from "next/link";

import { studentSignInAction } from "@/app/actions/auth";

export const instant = false;

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Student Login</h1>
      <p className="mt-2 text-sm text-slate-600">View your attendance history.</p>
      {error ? <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

      <form action={studentSignInAction} className="mt-6 space-y-3 rounded-lg border p-4">
        <input
          name="username"
          required
          placeholder="Username"
          className="w-full rounded border p-2"
          autoComplete="username"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password"
          className="w-full rounded border p-2"
          autoComplete="current-password"
        />
        <button type="submit" className="w-full rounded bg-slate-900 p-2 font-medium text-white">
          Login
        </button>
      </form>

      <p className="mt-4 text-sm">
        Admin? <Link href="/login" className="text-blue-600">Go to admin login</Link>
      </p>
    </main>
  );
}
