"use client";

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/context/theme-context";
import { ThemeMode } from "@/lib/theme";

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  const themeOptions = [
    { mode: "light", label: "浅色主题", icon: <Sun size={20} /> },
    { mode: "dark", label: "深色主题", icon: <Moon size={20} /> },
    { mode: "system", label: "跟随系统", icon: <Monitor size={20} /> },
  ] as const;

  const handleToggle = () => {
    const currentIndex = themeOptions.findIndex((option) => option.mode === mode);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setMode(themeOptions[nextIndex].mode as ThemeMode);
  };

  const getCurrentTheme = () => {
    return themeOptions.find((option) => option.mode === mode) || themeOptions[0];
  };

  const currentTheme = getCurrentTheme();

  return (
    <Tooltip title={`当前: ${currentTheme.label}，点击切换`}>
      <IconButton
        onClick={handleToggle}
        sx={{
          color: "text.secondary",
          "&:hover": { color: "text.primary" },
        }}
      >
        {currentTheme.icon}
      </IconButton>
    </Tooltip>
  );
}
