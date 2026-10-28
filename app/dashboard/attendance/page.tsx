import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


type ClassRow = { id: string; name: string };
type StudentRow = { id: string; full_name: string; roll_number: string };
type AttendanceRow = { student_id: string };

function startAndEndOfDate(dateInput: string) {
  const start = new Date(`${dateInput}T00:00:00.000Z`);
  const end = new Date(`${dateInput}T23:59:59.999Z`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const { supabase, profile } = await requireSchoolProfile();

  if (!profile?.id) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const classId = params.classId ?? "";
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", profile.id)
    .order("name")
    .returns<ClassRow[]>();

  let students: StudentRow[] = [];
  let presentSet = new Set<string>();

  if (classId) {
    const { data: classStudents } = await supabase
      .from("students")
      .select("id, full_name, roll_number")
      .eq("school_id", profile.id)
      .eq("class_id", classId)
      .order("roll_number")
      .returns<StudentRow[]>();

    students = classStudents ?? [];

    const { start, end } = startAndEndOfDate(selectedDate);
    const { data: attendance } = await supabase
      .from("attendance_logs")
      .select("student_id")
      .eq("class_id", classId)
      .gte("scanned_at", start)
      .lte("scanned_at", end)
      .returns<AttendanceRow[]>();

    presentSet = new Set((attendance ?? []).map((entry) => entry.student_id));
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">Attendance</h2>

      <form className="grid gap-3 md:grid-cols-3">
        <select name="classId" defaultValue={classId} className="rounded border p-2" required>
          <option value="">Select class</option>
          {(classes ?? []).map((classRow) => (
            <option key={classRow.id} value={classRow.id}>
              {classRow.name}
            </option>
          ))}
        </select>
        <input name="date" type="date" defaultValue={selectedDate} className="rounded border p-2" required />
        <button type="submit" className="rounded bg-slate-900 p-2 text-white">
          Filter
        </button>
      </form>

      {classId ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Showing {students.length} students</p>
          <Link
            href={`/api/attendance/export?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(selectedDate)}`}
            className="rounded border px-3 py-2 text-sm"
          >
            Export CSV
          </Link>
        </div>
      ) : null}

      <div className="overflow-hidden rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Roll</th>
              <th className="p-3">Student</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-3">{student.roll_number}</td>
                <td className="p-3">{student.full_name}</td>
                <td className="p-3">{presentSet.has(student.id) ? "Present" : "Absent"}</td>
              </tr>
            ))}
            {students.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={3}>
                  Select a class to view attendance.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
