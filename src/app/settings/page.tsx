import SettingsClient from "./settings-client";
import { getAllServers } from "@/lib/actions/server";
import { getAllExternalLinkProviders } from "@/lib/actions/external-link-provider";
import { unstable_noStore } from "next/cache";

export default async function SettingsPage() {
  unstable_noStore();
  // 在服务器端获取所有服务器数据
  const serversResult = await getAllServers();

  // 获取外部链接提供商数据
  const providersResult = await getAllExternalLinkProviders();

  // 将数据传递给客户端组件
  return (
    <SettingsClient
      initialServers={serversResult.success ? serversResult.value : []}
      initialProviders={providersResult.success ? providersResult.value : []}
    />
  );
}
