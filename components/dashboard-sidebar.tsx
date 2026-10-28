"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpenCheck, ClipboardList } from "lucide-react";

const links = [
  { href: "/dashboard/classes-students", label: "Classes & Students", icon: BookOpenCheck },
  { href: "/dashboard/esp32-status", label: "ESP32 Status", icon: Activity },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b bg-slate-900 p-4 text-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <h2 className="text-lg font-semibold">RFID Attendance</h2>
      <nav className="mt-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition ${
                active ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
