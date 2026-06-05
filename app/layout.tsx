import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC Kaona",
  description: "ระบบรับไม้และจัดเกรดด้วย AI - initial UI scaffold",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
