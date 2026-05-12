import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Y-Calendar: 추억의 기록",
  description: "당신의 추억을 안전하게 기록하고 보관하는 멀티미디어 캘린더",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Y-Calendar",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.className} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0f172a] overscroll-none">{children}</body>
    </html>
  );
}
