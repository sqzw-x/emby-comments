"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layouts/main-layout";
import EmbyServerSetting from "./components/emby-server";
import ExternalLinkSetting from "./components/external-link";
import { EmbyServer, ExternalLinkProvider } from "@prisma/client";
import { getAllExternalLinkProviders } from "@/lib/actions/external-link-provider";
import { getAllServers } from "@/lib/actions/server";
import { useToast } from "@/lib/context/toast-context";
import { Box, Stack, Tabs, Tab, Typography } from "@mui/material";

interface SettingsClientProps {
  initialServers: EmbyServer[];
  initialProviders: ExternalLinkProvider[];
}

export default function SettingsClient({ initialServers, initialProviders }: SettingsClientProps) {
  const [servers, setServers] = useState<EmbyServer[]>(initialServers);
  const [providers, setProviders] = useState<ExternalLinkProvider[]>(initialProviders);
  const [activeTab, setActiveTab] = useState(0);

  const toast = useToast();

  // 刷新服务器列表
  const fetchServers = async () => {
    // 使用 Server Action 获取所有服务器
    const result = await getAllServers();
    if (result.success) {
      setServers(result.value);
    } else {
      toast.showError(`获取服务器失败: ${result.message}`);
    }
  };

  // 刷新外部链接提供商列表
  const fetchProviders = async () => {
    const result = await getAllExternalLinkProviders();
    if (result.success) {
      setProviders(result.value);
    } else {
      toast.showError(`获取外部链接提供商失败: ${result.message}`);
    }
  };
  return (
    <MainLayout>
      <Stack spacing={4}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: "bold" }}>
          设置
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Emby 服务器" />
            <Tab label="外部链接" />
          </Tabs>
        </Box>
        {/* Emby 服务器设置 */}
        {activeTab === 0 && <EmbyServerSetting servers={servers} onServersChange={fetchServers} />}
        {/* 外部链接设置 */}
        {activeTab === 1 && <ExternalLinkSetting providers={providers} onProvidersChange={fetchProviders} />}
      </Stack>
    </MainLayout>
  );
}
