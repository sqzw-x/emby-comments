"use client";

import { Container, Typography } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import Link from "next/link";

import MuiThemeProvider, {
	ThemeContextProvider,
} from "@/lib/context/theme-context";
import Routes from "@/lib/routes";

export function NoServerFallback() {
	return (
		<AppRouterCacheProvider>
			<ThemeContextProvider>
				<MuiThemeProvider>
					<Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
						<Typography variant="h4" gutterBottom>
							没有激活的服务器
						</Typography>
						<Typography variant="body1">
							请前往设置页面添加或激活一个Emby服务器。
						</Typography>
						<Link
							href={Routes.settings()}
							style={{ marginTop: 16, display: "inline-block" }}
						>
							前往设置
						</Link>
					</Container>
				</MuiThemeProvider>
			</ThemeContextProvider>
		</AppRouterCacheProvider>
	);
}
