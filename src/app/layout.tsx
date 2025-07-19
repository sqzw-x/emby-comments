import "./globals.css";

import { Inter } from "next/font/google";
import React, { ReactNode } from "react";

import { MainContent } from "@/components/layouts/main-content";
import { NoServerFallback } from "@/components/layouts/no-server-fallback";
import { Providers } from "@/components/layouts/providers";
import { getConfig } from "@/lib/actions/config";
import { getActiveServer } from "@/lib/actions/server";
import { DEFAULT_CONFIG } from "@/lib/service/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // 在服务端获取激活的服务器
  const server = await getActiveServer();
  if (!server.success || !server.value) {
    return (
      <html lang="zh-CN">
        <head>
          <meta name="emotion-insertion-point" content="" />
        </head>
        <body className={inter.className}>
          <NoServerFallback />
        </body>
      </html>
    );
  }

  const r = await getConfig();
  let config;
  if (!r.success) {
    console.error("获取配置失败:", r.message);
    config = DEFAULT_CONFIG;
  } else {
    config = r.value;
  }

  return (
    <html lang="zh-CN">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={inter.className}>
        <Providers server={server.value} config={config}>
          <MainContent>{children}</MainContent>
        </Providers>
      </body>
    </html>
  );
}
