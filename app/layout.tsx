import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WCKaona",
  description: "ต้นแบบ UI สำหรับจัดการไม้เข้า-ออก"
};

export const viewport: Viewport = {
  themeColor: "#0f5f3a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
