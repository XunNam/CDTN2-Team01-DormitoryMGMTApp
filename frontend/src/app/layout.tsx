import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DormFlow | Đăng nhập",
  description: "Đăng nhập DormFlow để đăng ký chỗ ở và theo dõi thông tin lưu trú ký túc xá.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
