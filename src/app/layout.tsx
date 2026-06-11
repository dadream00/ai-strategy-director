import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 전략실장",
  description: "네이버 중심 마케팅 대행사용 AI 업무 자동화 MVP",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
