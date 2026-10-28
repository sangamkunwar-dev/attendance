import { redirect } from "next/navigation";

import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


async function completeOnboarding(formData: FormData) {
  "use server";

  const { supabase, user } = await requireSchoolProfile();
  const schoolName = String(formData.get("school_name") ?? "").trim();
  const classCount = Number(formData.get("class_count") ?? 0);

  if (!schoolName || !Number.isFinite(classCount) || classCount < 1) {
    redirect("/onboarding?error=Please provide valid school details");
  }

  const { error } = await supabase.from("school_profiles").upsert({
    admin_id: user.id,
    name: schoolName,
    class_count: classCount,
    onboarding_completed: true,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/classes-students");
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireSchoolProfile();
  const { error } = await searchParams;

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">School Onboarding</h1>
      <p className="mt-2 text-sm text-slate-600">Complete this once to initialize your dashboard.</p>
      {error ? <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

      <form action={completeOnboarding} className="mt-6 space-y-4 rounded-lg border p-4">
        <div>
          <label htmlFor="school_name" className="mb-1 block text-sm font-medium">
            Step 1: School Name
          </label>
          <input id="school_name" name="school_name" required className="w-full rounded border p-2" />
        </div>

        <div>
          <label htmlFor="class_count" className="mb-1 block text-sm font-medium">
            Step 2: Number of classes
          </label>
          <input
            id="class_count"
            name="class_count"
            required
            min={1}
            type="number"
            className="w-full rounded border p-2"
          />
        </div>

        <button type="submit" className="w-full rounded bg-slate-900 p-2 text-white">
          Save and Continue
        </button>
      </form>
    </main>
  );
}
