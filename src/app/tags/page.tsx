import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveServer } from "@/lib/actions/server";
import { getTagsByServerId } from "@/lib/actions/tag";
import Routes from "@/lib/routes";

import TagsClient from "./client";

export default async function TagsPage() {
	unstable_noStore();
	// 在服务器端获取活动服务器
	const result = await getActiveServer();

	// 如果没有活动服务器，重定向到设置页面
	if (!result.success || !result.value) {
		redirect(Routes.settings());
	}

	// 在服务器端获取标签数据
	const tagsResult = await getTagsByServerId(result.value.id);

	// 检查标签获取是否成功
	if (!tagsResult.success) {
		throw new Error(tagsResult.message);
	}

	// 将数据传递给客户端组件
	return <TagsClient allTags={tagsResult.value} />;
}
