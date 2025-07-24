"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { type PaletteMode, ThemeProvider } from "@mui/material/styles";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

import { createAppTheme, type ThemeMode } from "@/lib/theme";

interface ThemeContextType {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	systemMode: PaletteMode;
	effectiveMode: PaletteMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeContextProviderProps {
	children: React.ReactNode;
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
	const [mode, setMode] = useState<ThemeMode>("system");
	const [systemMode, setSystemMode] = useState<PaletteMode>("dark");

	// 检测系统主题
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemMode(mediaQuery.matches ? "dark" : "light");

		const listener = (e: MediaQueryListEvent) => {
			setSystemMode(e.matches ? "dark" : "light");
		};

		mediaQuery.addEventListener("change", listener);
		return () => mediaQuery.removeEventListener("change", listener);
	}, []);

	// 从 localStorage 读取保存的主题设置
	useEffect(() => {
		const saved = localStorage.getItem("theme-mode");
		if (saved && ["light", "dark", "system"].includes(saved)) {
			setMode(saved as ThemeMode);
		}
	}, []);

	// 保存主题设置到 localStorage
	const handleSetMode = useCallback((newMode: ThemeMode) => {
		setMode(newMode);
		localStorage.setItem("theme-mode", newMode);
	}, []);

	// 计算有效的主题模式
	const effectiveMode: PaletteMode = mode === "system" ? systemMode : mode;

	return (
		<ThemeContext.Provider
			value={{
				mode,
				setMode: handleSetMode,
				systemMode,
				effectiveMode,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeContextProvider");
	}
	return context;
}

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
