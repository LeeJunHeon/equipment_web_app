import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import BasePathFetch from "@/components/BasePathFetch";
import "./globals.css";

export const metadata: Metadata = {
  title: "장비 관리",
  description: "VanaM 장비 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full">
        <SessionProvider basePath={`${bp}/api/auth`}>
          <BasePathFetch />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
