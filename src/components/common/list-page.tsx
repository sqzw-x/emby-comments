"use client";

import React, { ReactNode } from "react";
import { LoadingSkeleton } from "@/components/common";
import { Box, Typography } from "@mui/material";

// 内容区域组件
export interface ContentAreaProps {
  children: ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonType?: "grid" | "list" | "cards";
  skeletonCount?: number;
  className?: string;
}

export function ContentArea({
  children,
  loading = false,
  isEmpty = false,
  emptyMessage = "暂无数据",
  skeletonType = "list",
  skeletonCount = 5,
  className = "",
}: ContentAreaProps) {
  if (loading) {
    return (
      <Box className={className}>
        <LoadingSkeleton type={skeletonType} count={skeletonCount} />
      </Box>
    );
  }
  if (isEmpty) {
    return (
      <Box className={className}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }
  return <Box className={className}>{children}</Box>;
}
