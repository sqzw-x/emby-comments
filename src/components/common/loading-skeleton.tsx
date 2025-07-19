"use client";

import { Box, Skeleton } from "@mui/material";
import React from "react";

export interface LoadingSkeletonProps {
  type: "grid" | "list" | "cards";
  count?: number;
}

export function LoadingSkeleton({ type, count = 5 }: LoadingSkeletonProps) {
  const skeletonItems = Array(count).fill(0);

  if (type === "grid") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
          gap: 2,
        }}
      >
        {skeletonItems.map((_, index) => (
          <Box key={index}>
            <Skeleton variant="rectangular" sx={{ aspectRatio: "2/3", borderRadius: 1 }} />
            <Skeleton variant="text" sx={{ mt: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === "list") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {skeletonItems.map((_, index) => (
          <Box key={index} sx={{ p: 2, borderRadius: 1, bgcolor: "action.hover" }}>
            <Skeleton variant="text" width="33%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="66%" height={16} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === "cards") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {skeletonItems.map((_, index) => (
          <Box key={index}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return null;
}
