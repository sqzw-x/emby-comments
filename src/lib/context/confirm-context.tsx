"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { AlertCircle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string; // default: "确认"
  cancelText?: string; // default: "取消"
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    options: { title: "", message: "" },
    onConfirm: () => {},
    onCancel: () => {},
    loading: false,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const handleConfirm = () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        resolve(true);
      };

      const handleCancel = () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        resolve(false);
      };

      setConfirmState({ open: true, options, onConfirm: handleConfirm, onCancel: handleCancel, loading: false });
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setConfirmState((prev) => ({ ...prev, loading }));
  }, []);

  const value = { confirm, setLoading };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {confirmState.open && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
          onClick={confirmState.onCancel}
        >
          <Card sx={{ width: "100%", maxWidth: "400px", m: 2 }} onClick={(e) => e.stopPropagation()}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* 图标和标题 */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <AlertCircle size={24} color="#f59e0b" />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {confirmState.options.title}
                  </Typography>
                </Stack>

                {/* 消息内容 */}
                <Typography variant="body1" color="text.secondary">
                  {confirmState.options.message}
                </Typography>

                {/* 按钮组 */}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={confirmState.onCancel} disabled={confirmState.loading}>
                    {confirmState.options.cancelText || "取消"}
                  </Button>
                  <Button variant="contained" onClick={confirmState.onConfirm} disabled={confirmState.loading}>
                    {confirmState.loading ? "处理中..." : confirmState.options.confirmText || "确认"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
