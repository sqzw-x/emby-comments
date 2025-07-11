"use client";

import { useEffect } from "react";
import { Button, Container, Typography, Box } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 记录全局错误
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <Container maxWidth="sm">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            gap={3}
          >
            <ErrorOutline color="error" sx={{ fontSize: 64 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              系统错误
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              应用程序遇到了意外错误，请刷新页面重试。
            </Typography>
            <Button variant="contained" onClick={reset} sx={{ mt: 2 }}>
              重新加载
            </Button>
          </Box>
        </Container>
      </body>
    </html>
  );
}
