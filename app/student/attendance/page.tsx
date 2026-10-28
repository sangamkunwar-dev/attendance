import { redirect } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export const instant = false;


type StudentAttendance = {
  id: string;
  status: string;
  scanned_at: string;
  classes: { name: string } | null;
};

export default async function StudentAttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("auth_user_id", user.id)
    .single<{ id: string; full_name: string }>();

  if (!student) {
    redirect("/student/login?error=Student profile not found");
  }

  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("id, status, scanned_at, classes(name)")
    .eq("student_id", student.id)
    .order("scanned_at", { ascending: false })
    .returns<StudentAttendance[]>();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{student.full_name}&apos;s Attendance</h1>
          <p className="text-sm text-slate-600">Latest attendance records</p>
        </div>
        <form action={signOutAction}>
          <button className="rounded border px-3 py-2 text-sm">Sign out</button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Class</th>
              <th className="p-3">Status</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {(attendance ?? []).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.classes?.name ?? "-"}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{new Date(row.scanned_at).toLocaleString()}</td>
              </tr>
            ))}
            {attendance?.length ? null : (
              <tr>
                <td className="p-3 text-slate-500" colSpan={3}>
                  No attendance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
