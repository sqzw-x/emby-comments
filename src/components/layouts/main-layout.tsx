import React, { ReactNode } from "react";
import Link from "next/link";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Container,
} from "@mui/material";
import { Home, Settings, Film, Tag, MessageSquare, Wrench, Tags } from "lucide-react";
import Routes from "@/lib/routes";
import ThemeSwitcher from "./theme-switcher";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const drawerWidth = 256;

  const menuItems = [
    { href: Routes.home(), icon: <Home size={18} />, text: "首页" },
    { href: Routes.items(), icon: <Film size={18} />, text: "媒体库" },
    { href: Routes.tags(), icon: <Tag size={18} />, text: "标签" },
    { href: Routes.comments(), icon: <MessageSquare size={18} />, text: "评论" },
    { href: Routes.itemsAdmin(), icon: <Wrench size={18} />, text: "媒体管理" },
    { href: Routes.tagsAdmin(), icon: <Tags size={18} />, text: "标签管理" },
    { href: Routes.settings(), icon: <Settings size={18} />, text: "设置" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* 侧边导航栏 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
            Emby Comments
          </Typography>
        </Box>

        <List sx={{ px: 2, flexGrow: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{ borderRadius: 1, "&:hover": { backgroundColor: "action.hover" } }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* 主题切换按钮 */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <ThemeSwitcher />
          </Box>
        </Box>
      </Drawer>

      {/* 主内容区 */}
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: "background.default", minWidth: 0 }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
