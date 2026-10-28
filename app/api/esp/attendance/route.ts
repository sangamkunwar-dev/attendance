import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type EspPayload = {
  device_token?: string;
  card_uid?: string;
};

export async function POST(req: Request) {
  let payload: EspPayload;

  try {
    payload = (await req.json()) as EspPayload;
  } catch {
    return NextResponse.json({ status: "denied", message: "Invalid JSON payload" }, { status: 400 });
  }

  const deviceToken = payload.device_token?.trim();
  const cardUid = payload.card_uid?.trim();

  if (!deviceToken) {
    return NextResponse.json({ status: "denied", message: "Device Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: classRow } = await supabase
    .from("classes")
    .select("id, name, is_active")
    .eq("device_token", deviceToken)
    .single<{ id: string; name: string; is_active: boolean }>();

  if (!classRow || !classRow.is_active) {
    return NextResponse.json({ status: "denied", message: "Device Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("classes")
    .update({ is_device_online: true, last_seen_at: new Date().toISOString() })
    .eq("id", classRow.id);

  if (!cardUid) {
    return NextResponse.json({ status: "success", message: "Heartbeat received", class: classRow.name });
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("class_id", classRow.id)
    .eq("card_uid", cardUid)
    .single<{ id: string; full_name: string }>();

  if (!student) {
    return NextResponse.json({ status: "denied", message: "Access Denied / Unknown Card" }, { status: 403 });
  }

  const { error } = await supabase.from("attendance_logs").insert({
    class_id: classRow.id,
    student_id: student.id,
    status: "Present",
    card_uid: cardUid,
  });

  if (error) {
    return NextResponse.json({ status: "denied", message: "Failed to save attendance" }, { status: 500 });
  }

  return NextResponse.json({
    status: "success",
    student_name: student.full_name,
    message: "Attendance Recorded",
  });
}
