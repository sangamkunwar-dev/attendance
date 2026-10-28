import { NextResponse } from "next/server";

import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


type StudentRow = { id: string; full_name: string; roll_number: string };

type AttendanceRow = { student_id: string };

function csvSafe(value: string) {
  const trimmed = value.trim();
  if (["=", "+", "-", "@"].includes(trimmed.charAt(0))) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function startAndEndOfDate(dateInput: string) {
  const start = new Date(`${dateInput}T00:00:00.000Z`);
  const end = new Date(`${dateInput}T23:59:59.999Z`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(req: Request) {
  const { supabase, profile } = await requireSchoolProfile();

  if (!profile?.id) {
    return NextResponse.json({ error: "Onboarding not completed" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "classId and date are required" }, { status: 400 });
  }

  const { data: classRow } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .eq("school_id", profile.id)
    .single<{ id: string; name: string }>();

  if (!classRow) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, roll_number")
    .eq("class_id", classId)
    .eq("school_id", profile.id)
    .order("roll_number")
    .returns<StudentRow[]>();

  const { start, end } = startAndEndOfDate(date);
  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("student_id")
    .eq("class_id", classId)
    .gte("scanned_at", start)
    .lte("scanned_at", end)
    .returns<AttendanceRow[]>();

  const presentIds = new Set((attendance ?? []).map((row) => row.student_id));
  const rows = [
    ["Class", "Date", "Roll Number", "Student Name", "Status"],
    ...(students ?? []).map((student) => [
      csvSafe(classRow.name),
      csvSafe(date),
      csvSafe(student.roll_number),
      csvSafe(student.full_name),
      presentIds.has(student.id) ? "Present" : "Absent",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=attendance-${classRow.name}-${date}.csv`,
    },
  });
}
