import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getConfig } from "@/lib/actions/config";
import { filterLocalItems } from "@/lib/actions/item";
import { getActiveServer } from "@/lib/actions/server";
import { getTagsByServerId } from "@/lib/actions/tag";
import Routes from "@/lib/routes";
import type { ItemSearchOptions } from "@/lib/service/item";
import { parseSearchParams, type SafeSearchParam } from "@/lib/utils/params";

import Items from "./client";

export interface ItemsProps {
	searchParams: Promise<SafeSearchParam<ItemSearchOptions>>;
}

export default async function Page({ searchParams }: ItemsProps) {
	unstable_noStore();
	const server = await getActiveServer();
	if (!server.success || !server.value) redirect(Routes.settings());

	const config = await getConfig();
	if (!config.success) throw new Error(`获取配置失败: ${config.message}`);

	const query = await searchParams;
	query.sortBy = query.sortBy || config.value["items.sortBy"];
	query.sortOrder = query.sortOrder || config.value["items.sortOrder"];

	const normalizedQuery = parseSearchParams<ItemSearchOptions>(query, {
		numberFields: ["yearFrom", "yearTo"],
		numberArrayFields: ["tagIds"],
	});

	// 并行获取电影数据和标签选项
	const [movies, tags] = await Promise.all([
		filterLocalItems(normalizedQuery, server.value.id),
		getTagsByServerId(server.value.id, "name"),
	]);

	if (!movies.success) {
		redirect(Routes.items());
	}

	if (!tags.success) {
		console.error("获取标签数据失败:", tags.message);
	}

	// 将数据传递给客户端组件
	return (
		<Items
			items={movies.value.map((item) => {
				const embyItem = item.embyItems[0];
				return {
					...item,
					embyItem,
					rating: item.rating?.score || null,
					tags: item.tags.map((t) => t.name),
				};
			})}
			activeServer={server.value}
			searchOptions={normalizedQuery}
			tagOptions={tags.success ? tags.value : []}
		/>
	);
}
