import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { getAllExternalLinkProviders } from "@/lib/actions/external-link-provider";
import { getActiveServer } from "@/lib/actions/server";
import { getAllTags } from "@/lib/actions/tag";
import { dbClient } from "@/lib/db/prisma";
import Routes from "@/lib/routes";

import ItemClient from "./item-client";

export interface ItemProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: ItemProps) {
  // 获取项目ID
  const { id } = await params;
  const itemId = parseInt(id);

  // 验证 ID 是否为有效数字
  if (isNaN(itemId)) {
    notFound();
  }

  // 在服务器端获取活动服务器
  const result = await getActiveServer();

  // 如果没有活动服务器，重定向到设置页面
  if (!result.success || !result.value) {
    redirect(Routes.settings());
  }
  const activeServer = result.value;

  // 在服务器端获取项目详情
  // todo: 封装为 action
  const localItem = await dbClient.localItem.findFirst({
    where: { id: itemId },
    include: { tags: true, rating: true, embyItems: { where: { embyServerId: activeServer.id } } },
  });

  if (!localItem) {
    notFound();
  }

  const externalLinkProviders = await getAllExternalLinkProviders();
  if (!externalLinkProviders.success) {
    console.error("获取外部链接提供商失败:", externalLinkProviders.message);
    redirect(Routes.settings());
  }

  const tags = await getAllTags();
  if (!tags.success) {
    throw new Error(tags.message);
  }

  const item = {
    ...localItem,
    embyItem: localItem.embyItems.length > 0 ? localItem.embyItems[0] : null,
  };

  // 将数据传递给客户端组件
  return (
    <ItemClient
      item={item}
      activeServer={activeServer}
      externalLinkProviders={externalLinkProviders.value}
      allTags={tags.value.map((tag) => tag.name)}
    />
  );
}
