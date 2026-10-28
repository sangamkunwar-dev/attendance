import { redirect } from "next/navigation";

import { requireSchoolProfile } from "@/lib/auth";

export const instant = false;


type StatusClass = {
  id: string;
  name: string;
  is_device_online: boolean;
  last_seen_at: string | null;
};

export default async function Esp32StatusPage() {
  const { supabase, profile } = await requireSchoolProfile();

  if (!profile?.id) {
    redirect("/onboarding");
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, is_device_online, last_seen_at")
    .eq("school_id", profile.id)
    .order("name")
    .returns<StatusClass[]>();

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">ESP32 Status Monitor</h2>
      <p className="mt-1 text-sm text-slate-600">Class status updates when heartbeat traffic is received from ESP32 devices.</p>

      <div className="mt-4 overflow-hidden rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Class</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {(classes ?? []).map((classRow) => {
              const isOnline = classRow.is_device_online;

              return (
                <tr key={classRow.id} className="border-t">
                  <td className="p-3">{classRow.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="p-3">{classRow.last_seen_at ? new Date(classRow.last_seen_at).toLocaleString() : "Never"}</td>
                </tr>
              );
            })}
            {(classes ?? []).length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={3}>
                  No classes added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
