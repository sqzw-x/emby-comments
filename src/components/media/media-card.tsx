import React from "react";
import Link from "next/link";
import { Card, CardMedia, CardContent, Typography, Box, Stack, Chip, Tooltip } from "@mui/material";
import { Star } from "lucide-react";
import { EmbyItem, EmbyServer, LocalItem } from "@prisma/client";
import Routes from "@/lib/routes";

export interface ItemForCard extends LocalItem {
  embyItem: EmbyItem | null;
  rating: number | null;
  tags: string[];
}

interface MediaCardProps {
  item: ItemForCard;
  activeServer: EmbyServer;
}

export function MediaCard({ item, activeServer }: MediaCardProps) {
  // 构建海报URL
  const posterUrl = item.embyItem ? `${activeServer.url}/Items/${item.embyItem.embyId}/Images/Primary` : undefined;

  // 完整标题（包含年份）
  const fullTitle = `${item.title} ${`(${item.premiereDate?.getFullYear()})` && ""}`;

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case "Movie":
        return "电影";
      case "Series":
        return "剧集";
      default:
        return type;
    }
  };

  return (
    <Tooltip title={fullTitle} placement="bottom" arrow>
      <Card
        component={Link}
        href={Routes.itemDetail({ id: item.id.toString() })}
        sx={{
          textDecoration: "none",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 海报图片容器 */}
        <Box sx={{ position: "relative", paddingTop: "150%" }}>
          <CardMedia
            component="img"
            image={posterUrl}
            alt={item.title}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />

          {/* 媒体类型徽章 */}
          <Chip
            label={getMediaTypeLabel(item.type)}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              fontSize: "0.75rem",
            }}
          />

          {/* 评分 */}
          {item.rating && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
              }}
            >
              <Star size={12} fill="#fbbf24" color="#fbbf24" />
              <Typography variant="caption" sx={{ color: "white" }}>
                {item.rating.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 媒体信息 */}
        <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
          <Typography
            variant="subtitle2"
            component="h3"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mb: 1,
            }}
          >
            {fullTitle}
          </Typography>

          {/* 标签展示 */}
          {item.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {item.tags.slice(0, 2).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              ))}
              {item.tags.length > 2 && (
                <Chip
                  label={`+${item.tags.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 20 }}
                />
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
}
