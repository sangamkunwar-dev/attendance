import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { profile } = await requireSchoolProfile();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="md:flex">
      <DashboardSidebar />
      <main className="min-h-screen flex-1 bg-slate-50">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">School</p>
            <h1 className="font-semibold">{profile.name}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/student/login" className="rounded border px-3 py-2 text-sm">
              Student Portal
            </Link>
            <form action={signOutAction}>
              <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Sign out</button>
            </form>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
