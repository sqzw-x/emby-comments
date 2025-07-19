"use client";
import { Box, Chip, Typography } from "@mui/material";
import { Tag as TagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import Routes from "@/lib/routes";
import { TagWithCount } from "@/lib/service/tag";

interface TagItemProps {
  tag: TagWithCount;
}

export default function TagItem({ tag }: TagItemProps) {
  const router = useRouter();
  return (
    <Box
      onClick={() => router.push(Routes.tagDetail({ id: tag.id.toString() }))}
      sx={{
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": { borderColor: "primary.main", backgroundColor: "action.hover" },
        maxWidth: 280,
        minWidth: 200, // 在容器内自适应
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <TagIcon size={16} />
        <Typography
          variant="subtitle2"
          fontWeight="medium"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, maxWidth: 180 }}
          title={tag.name}
        >
          {tag.name}
        </Typography>
      </Box>

      {tag.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            fontSize: "0.8rem",
            maxWidth: "100%",
          }}
          title={tag.description}
        >
          {tag.description}
        </Typography>
      )}

      <Chip label={`${tag._count.items} 项`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
    </Box>
  );
}
