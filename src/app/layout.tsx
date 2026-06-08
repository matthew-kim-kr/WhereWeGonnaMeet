import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 어디서 만날까?",
  description: "n명의 출발역을 입력하면 모두가 이동하기 가장 편한 중간 지하철역을 추천해드립니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
