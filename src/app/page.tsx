import { Box, Button, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import { Film, MessageSquare, Settings, Tag, Tags, Wrench } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import Routes from "@/lib/routes";

export const metadata: Metadata = {
  title: "Emby Comments - 自定义评论与标签系统",
  description: "为Emby媒体资源添加自定义评论、标签等信息",
};

export default function Home() {
  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" component="h1" sx={{ fontWeight: "bold" }}>
          欢迎使用 Emby Comments
        </Typography>
        <Button variant="contained" component={Link} href={Routes.settings()}>
          配置 Emby 服务器
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        <DashboardCard
          title="媒体库"
          description="浏览和管理您的电影、剧集等媒体资源"
          icon={<Film size={32} />}
          href={Routes.items()}
          color="primary.main"
        />
        <DashboardCard
          title="标签"
          description="创建、编辑和分配标签到您的媒体"
          icon={<Tag size={32} />}
          href={Routes.tags()}
          color="success.main"
        />
        <DashboardCard
          title="评论"
          description="查看和管理您的评论内容"
          icon={<MessageSquare size={32} />}
          href={Routes.comments()}
          color="secondary.main"
        />
        <DashboardCard
          title="媒体管理"
          description="批量管理媒体资源，执行高级操作"
          icon={<Wrench size={32} />}
          href={Routes.itemsAdmin()}
          color="error.main"
        />
        <DashboardCard
          title="标签管理"
          description="批量管理标签，高级标签操作"
          icon={<Tags size={32} />}
          href={Routes.tagsAdmin()}
          color="error.dark"
        />
        <DashboardCard
          title="设置"
          description="管理系统设置"
          icon={<Settings size={32} />}
          href={Routes.settings()}
          color="grey.700"
        />
      </Box>
    </Stack>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function DashboardCard({ title, description, icon, href, color }: DashboardCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
        <Box
          sx={{
            backgroundColor: color,
            color: "white",
            p: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
