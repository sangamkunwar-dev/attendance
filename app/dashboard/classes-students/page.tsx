import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


type ClassRow = {
  id: string;
  name: string;
  device_token: string;
  is_device_online: boolean;
  last_seen_at: string | null;
};

type StudentRow = {
  id: string;
  full_name: string;
  roll_number: string;
  card_uid: string;
  portal_username: string;
};

function normalizeStudentEmail(username: string) {
  return `student+${username.toLowerCase()}@attendance.local`;
}

async function createClassAction(formData: FormData) {
  "use server";

  const { supabase, profile } = await requireSchoolProfile();
  if (!profile?.id) {
    redirect("/onboarding");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/dashboard/classes-students?error=Class name is required");
  }

  const token = `esp_${crypto.randomUUID().replace(/-/g, "")}`;

  const { error } = await supabase.from("classes").insert({
    school_id: profile.id,
    name,
    device_token: token,
  });

  if (error) {
    redirect(`/dashboard/classes-students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/classes-students");
  redirect("/dashboard/classes-students?message=Class created");
}

async function addStudentAction(formData: FormData) {
  "use server";

  const { supabase, profile } = await requireSchoolProfile();
  if (!profile?.id) {
    redirect("/onboarding");
  }

  const classId = String(formData.get("class_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const rollNumber = String(formData.get("roll_number") ?? "").trim();
  const cardUid = String(formData.get("card_uid") ?? "").trim();
  const username = String(formData.get("portal_username") ?? "").trim().toLowerCase();
  const password = String(formData.get("portal_password") ?? "");

  if (!classId || !fullName || !rollNumber || !cardUid || !username || !password) {
    redirect("/dashboard/classes-students?error=All student fields are required");
  }

  const { data: classRow } = await supabase
    .from("classes")
    .select("id, is_device_online")
    .eq("id", classId)
    .eq("school_id", profile.id)
    .single<{ id: string; is_device_online: boolean }>();

  if (!classRow) {
    redirect("/dashboard/classes-students?error=Class not found");
  }

  if (!classRow.is_device_online) {
    redirect("/dashboard/classes-students?error=ESP32 must connect before adding students");
  }

  const adminSupabase = createAdminClient();
  const { data: createdUser, error: userError } = await adminSupabase.auth.admin.createUser({
    email: normalizeStudentEmail(username),
    password,
    email_confirm: true,
    user_metadata: { role: "student", username },
  });

  if (userError || !createdUser.user) {
    redirect(
      `/dashboard/classes-students?error=${encodeURIComponent(userError?.message ?? "Unable to create student account")}`,
    );
  }

  const { error: studentError } = await supabase.from("students").insert({
    school_id: profile.id,
    class_id: classId,
    full_name: fullName,
    roll_number: rollNumber,
    card_uid: cardUid,
    portal_username: username,
    auth_user_id: createdUser.user.id,
  });

  if (studentError) {
    await adminSupabase.auth.admin.deleteUser(createdUser.user.id);
    redirect(`/dashboard/classes-students?error=${encodeURIComponent(studentError.message)}`);
  }

  revalidatePath("/dashboard/classes-students");
  redirect("/dashboard/classes-students?message=Student added");
}

export default async function ClassesAndStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const { supabase, profile } = await requireSchoolProfile();

  if (!profile?.id) {
    redirect("/onboarding");
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, device_token, is_device_online, last_seen_at")
    .eq("school_id", profile.id)
    .order("name")
    .returns<ClassRow[]>();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, roll_number, card_uid, portal_username, class_id")
    .eq("school_id", profile.id)
    .order("full_name")
    .returns<(StudentRow & { class_id: string })[]>();

  const studentsByClass = new Map<string, (StudentRow & { class_id: string })[]>();
  (students ?? []).forEach((student) => {
    const list = studentsByClass.get(student.class_id) ?? [];
    list.push(student);
    studentsByClass.set(student.class_id, list);
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Create Class</h2>
        <p className="text-sm text-slate-600">Each class gets a unique ESP32 device token.</p>
        {error ? <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded bg-emerald-100 p-2 text-sm text-emerald-700">{message}</p> : null}

        <form action={createClassAction} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            name="name"
            required
            placeholder="Grade 7"
            className="flex-1 rounded border p-2"
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
            Add Class
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {(classes ?? []).map((classRow) => (
          <article key={classRow.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{classRow.name}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  classRow.is_device_online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {classRow.is_device_online ? "ESP32 Connected" : "ESP32 Offline"}
              </span>
            </div>

            <p className="mt-2 break-all rounded bg-slate-100 p-2 font-mono text-xs">{classRow.device_token}</p>
            <p className="mt-1 text-xs text-slate-500">
              Last seen:{" "}
              {classRow.last_seen_at ? new Date(classRow.last_seen_at).toLocaleString() : "Never"}
            </p>

            <form action={addStudentAction} className="mt-4 space-y-2 rounded border p-3">
              <input type="hidden" name="class_id" value={classRow.id} />
              <input name="full_name" required placeholder="Student Name" className="w-full rounded border p-2" />
              <input name="roll_number" required placeholder="Roll Number" className="w-full rounded border p-2" />
              <input name="card_uid" required placeholder="RFID Card UID" className="w-full rounded border p-2" />
              <input name="portal_username" required placeholder="Portal Username" className="w-full rounded border p-2" />
              <input
                name="portal_password"
                required
                minLength={6}
                type="password"
                placeholder="Portal Password"
                className="w-full rounded border p-2"
              />
              <button className="w-full rounded bg-slate-900 p-2 text-white" type="submit">
                Add Student
              </button>
            </form>

            <div className="mt-4 overflow-hidden rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Roll</th>
                    <th className="p-2">UID</th>
                    <th className="p-2">Username</th>
                  </tr>
                </thead>
                <tbody>
                  {(studentsByClass.get(classRow.id) ?? []).map((student) => (
                    <tr key={student.id} className="border-t">
                      <td className="p-2">{student.full_name}</td>
                      <td className="p-2">{student.roll_number}</td>
                      <td className="p-2">{student.card_uid}</td>
                      <td className="p-2">{student.portal_username}</td>
                    </tr>
                  ))}
                  {(studentsByClass.get(classRow.id) ?? []).length === 0 ? (
                    <tr>
                      <td className="p-2 text-slate-500" colSpan={4}>
                        No students yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
