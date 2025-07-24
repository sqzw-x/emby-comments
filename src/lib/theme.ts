import { createTheme, type PaletteMode } from "@mui/material/styles";

// 主题模式类型
export type ThemeMode = "light" | "dark" | "system";

// 创建主题工厂函数
export const createAppTheme = (mode: PaletteMode) => {
	const isDark = mode === "dark";

	return createTheme({
		cssVariables: true, // 启用 CSS 变量以改善 SSR 性能
		palette: {
			mode,
			primary: {
				main: isDark ? "#90caf9" : "#1976d2", // Material Design Blue
				light: isDark ? "#bbdefb" : "#42a5f5",
				dark: isDark ? "#64b5f6" : "#1565c0",
			},
			secondary: {
				main: isDark ? "#ce93d8" : "#9c27b0", // Material Design Purple
				light: isDark ? "#f3e5f5" : "#ba68c8",
				dark: isDark ? "#ab47bc" : "#7b1fa2",
			},
			background: {
				default: isDark ? "#121212" : "#fafafa",
				paper: isDark ? "#1e1e1e" : "#ffffff",
			},
			text: {
				primary: isDark ? "rgba(255, 255, 255, 0.87)" : "rgba(0, 0, 0, 0.87)",
				secondary: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
			},
			divider: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
			action: {
				active: isDark ? "rgba(255, 255, 255, 0.54)" : "rgba(0, 0, 0, 0.54)",
				hover: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
				selected: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
				disabled: isDark ? "rgba(255, 255, 255, 0.26)" : "rgba(0, 0, 0, 0.26)",
				disabledBackground: isDark
					? "rgba(255, 255, 255, 0.12)"
					: "rgba(0, 0, 0, 0.12)",
			},
		},
		typography: {
			fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
			h1: {
				fontSize: "2.5rem",
				fontWeight: 700,
			},
			h2: {
				fontSize: "2rem",
				fontWeight: 600,
			},
			h3: {
				fontSize: "1.5rem",
				fontWeight: 600,
			},
			h4: {
				fontSize: "1.25rem",
				fontWeight: 600,
			},
			h5: {
				fontSize: "1.125rem",
				fontWeight: 600,
			},
			h6: {
				fontSize: "1rem",
				fontWeight: 600,
			},
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: "none", // 保持原始文本大小写
						borderRadius: "8px",
					},
				},
			},
			MuiTextField: {
				styleOverrides: {
					root: {
						"& .MuiOutlinedInput-root": {
							borderRadius: "8px",
						},
					},
				},
			},
			MuiCard: {
				styleOverrides: {
					root: {
						borderRadius: "12px",
						boxShadow: isDark
							? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)"
							: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
					},
				},
			},
			MuiDrawer: {
				styleOverrides: {
					paper: {
						backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
						borderRight: isDark
							? "1px solid rgba(255, 255, 255, 0.12)"
							: "1px solid rgba(0, 0, 0, 0.12)",
					},
				},
			},
		},
	});
};

// 默认主题（暗色）
export const theme = createAppTheme("dark");
