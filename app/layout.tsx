import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RFID Attendance System",
  description: "Multi-class school attendance tracking with ESP32 + Supabase",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
