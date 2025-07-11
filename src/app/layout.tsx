import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServerProvider } from "@/lib/context/server-context";
import { ThemeContextProvider } from "@/lib/context/theme-context";
import { getActiveServer } from "@/lib/actions/server";
import MuiThemeProvider from "@/components/providers/mui-theme-provider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ToastProvider } from "@/lib/context/toast-context";
import { ConfirmProvider } from "@/lib/context/confirm-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // 使用font-display: swap提高字体加载性能
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ], // 提供完整的备选字体栈
  adjustFontFallback: true, // 启用字体调整以减少布局偏移
});

export const metadata: Metadata = {
  title: "Emby Comments - 自定义评论与标签系统",
  description: "为Emby媒体资源添加自定义评论、标签等信息",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 在服务端获取激活的服务器
  const result = await getActiveServer();
  if (!result.success) {
    // 如果没有激活的服务器，重定向到设置页面
    return (
      <html lang="zh-CN">
        <head>
          <meta name="emotion-insertion-point" content="" />
        </head>
        <body className={inter.className}>
          <p>请先设置Emby服务器。</p>
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-CN">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeContextProvider>
            <MuiThemeProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <ServerProvider initialActiveServer={result.value}>{children}</ServerProvider>
                </ConfirmProvider>
              </ToastProvider>
            </MuiThemeProvider>
          </ThemeContextProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
