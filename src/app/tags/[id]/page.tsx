import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { getActiveServer } from "@/lib/actions/server";
import { getTagWithItems } from "@/lib/actions/tag";
import Routes from "@/lib/routes";

import TagDetailClient from "./client";

export interface TagDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TagDetailPage({ params }: TagDetailProps) {
  // 获取标签ID
  const { id } = await params;
  const id_ = parseInt(id);
  if (isNaN(id_)) {
    notFound();
  }

  // 在服务器端获取活动服务器
  const result = await getActiveServer();

  // 如果没有活动服务器，重定向到设置页面
  if (!result.success || !result.value) {
    redirect(Routes.settings());
  }
  const activeServer = result.value;

  // 在服务器端获取标签详情和关联项目
  const tagResult = await getTagWithItems(id_, activeServer.id);

  if (!tagResult.success || !tagResult.value) {
    notFound();
  }

  // 将数据传递给客户端组件
  return <TagDetailClient tag={tagResult.value} activeServer={activeServer} />;
}
