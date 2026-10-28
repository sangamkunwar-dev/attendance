import Link from "next/link";

import { signInAction } from "@/app/actions/auth";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <p className="mt-2 text-sm text-slate-600">Manage classes, devices, and attendance.</p>
      {error ? <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded bg-emerald-100 p-2 text-sm text-emerald-700">{message}</p> : null}

      <form action={signInAction} className="mt-6 space-y-3 rounded-lg border p-4">
        <input name="email" type="email" required placeholder="Email" className="w-full rounded border p-2" />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password"
          className="w-full rounded border p-2"
        />
        <button type="submit" className="w-full rounded bg-slate-900 p-2 font-medium text-white">
          Login
        </button>
      </form>

      <p className="mt-4 text-sm">
        Don&apos;t have an account? <Link href="/signup" className="text-blue-600">Create one</Link>
      </p>
      <p className="mt-2 text-sm">
        Student? <Link href="/student/login" className="text-blue-600">Login here</Link>
      </p>
    </main>
  );
}
