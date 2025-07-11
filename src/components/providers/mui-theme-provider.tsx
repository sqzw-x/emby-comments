"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "@/lib/theme";
import { useTheme } from "@/lib/context/theme-context";

interface MuiThemeProviderProps {
  children: React.ReactNode;
}

export default function MuiThemeProvider({ children }: MuiThemeProviderProps) {
  const { effectiveMode } = useTheme();
  const theme = createAppTheme(effectiveMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
