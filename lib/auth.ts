import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SchoolProfile = {
  id: string;
  admin_id: string;
  name: string | null;
  class_count: number | null;
  onboarding_completed: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function requireSchoolProfile() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("school_profiles")
    .select("id, admin_id, name, class_count, onboarding_completed")
    .eq("admin_id", user.id)
    .single<SchoolProfile>();

  if (!profile) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile };
}
