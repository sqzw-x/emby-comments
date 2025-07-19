"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { EmbyServer } from "@prisma/client";

import { ConfigProvider } from "@/lib/context/config-context";
import { ConfirmProvider } from "@/lib/context/confirm-context";
import { ServerProvider } from "@/lib/context/server-context";
import MuiThemeProvider, { ThemeContextProvider } from "@/lib/context/theme-context";
import { ToastProvider } from "@/lib/context/toast-context";
import { Config } from "@/lib/service/config";

type ProvidersProps = Readonly<{ children: React.ReactNode; server: EmbyServer; config: Config }>;

export function Providers({ children, server, config }: ProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeContextProvider>
        <MuiThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <ServerProvider initialActiveServer={server}>
                <ConfigProvider initial={config}>{children}</ConfigProvider>
              </ServerProvider>
            </ConfirmProvider>
          </ToastProvider>
        </MuiThemeProvider>
      </ThemeContextProvider>
    </AppRouterCacheProvider>
  );
}
