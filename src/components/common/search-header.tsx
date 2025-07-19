"use client";

import { Box, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { Button } from "@mui/material";
import { Search, SlidersHorizontal } from "lucide-react";
import React, { ReactNode } from "react";

export interface SearchHeaderProps {
  // 基础配置
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;

  // 搜索行为配置
  onSubmit?: (e: React.FormEvent) => void; // 如果提供，则使用表单提交模式

  // 筛选器配置
  onToggleFilters?: () => void;

  // 操作按钮配置
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };

  // 额外的操作按钮
  extraActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: "contained" | "outlined" | "text";
    disabled?: boolean;
  }>;
}

export function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  onSubmit,
  onToggleFilters,
  primaryAction,
  extraActions = [],
}: SearchHeaderProps) {
  const searchInput = (
    <TextField
      type="search"
      placeholder={searchPlaceholder}
      value={searchTerm}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: { xs: "100%", md: "300px" }, maxWidth: { xs: "100%", md: "400px" } }}
    />
  );

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: "background.paper", borderRadius: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        {/* 标题 */}
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>

        {/* 操作区域 */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
          {/* 搜索区域 */}
          {onSubmit ? (
            // 表单提交模式 (如电影页面)
            <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
              {searchInput}
              <Button type="submit">搜索</Button>
            </Box>
          ) : (
            searchInput // 实时搜索模式 (如评论和标签页面)
          )}

          {/* 筛选器按钮 */}
          {onToggleFilters && (
            <Button variant="outlined" onClick={onToggleFilters}>
              <SlidersHorizontal size={18} />
            </Button>
          )}

          {/* 主要操作按钮 */}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled} sx={{ gap: 1 }}>
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </Button>
          )}

          {/* 额外操作按钮 */}
          {extraActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outlined"}
              onClick={action.onClick}
              disabled={action.disabled}
              sx={{ gap: 1 }}
            >
              {action.icon}
              {action.label && <span>{action.label}</span>}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
