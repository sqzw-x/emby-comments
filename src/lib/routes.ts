import type { ItemProps } from "@/app/items/[id]/page";
import type { ItemsProps } from "@/app/items/page";
import type { TagDetailProps } from "@/app/tags/[id]/page";

// 定义页面路径常量, 每个页面路由对应一项
type Pages =
	| "home"
	| "comments"
	| "items"
	| "itemDetail"
	| "settings"
	| "tags"
	| "tagDetail"
	| "itemsAdmin"
	| "tagsAdmin";
// 每个页面的 props, 若不需要则为 null
type Props = {
	home: null;
	comments: null;
	items: ItemsProps;
	itemDetail: ItemProps;
	settings: null;
	tags: null;
	tagDetail: TagDetailProps;
	itemsAdmin: null;
	tagsAdmin: null;
};
// 路由构建器
const Routes: { [K in Pages]: PathBuilder<Props[K]> } = {
	home: () => "/",
	comments: () => "/comments",
	items: (searchParams) => `/items${buildSearchParams(searchParams)}`,
	itemDetail: (params) => `/items/${params.id}`,
	settings: () => "/settings",
	tags: () => "/tags",
	tagDetail: (params) => `/tags/${params.id}`,
	itemsAdmin: () => "/admin/items",
	tagsAdmin: () => "/admin/tags",
};
export default Routes;

export const buildSearchParams = (
	searchParams?: Record<string, string | string[] | undefined>,
) => {
	if (!searchParams) return "";
	const params = new URLSearchParams();

	Object.entries(searchParams).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			if (Array.isArray(value)) {
				value.forEach((v) => {
					if (v !== undefined && v !== null && v !== "") {
						params.append(key, v);
					}
				});
			} else {
				params.append(key, value);
			}
		}
	});
	const s = params.toString();
	return s ? `?${s}` : "";
};

// 保证类型安全
type PageProps = {
	params?: Promise<Record<string, string | string[]>>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type GetParams<T extends PageProps | null> = T extends {
	params: Promise<Record<string, string | string[]>>;
}
	? Awaited<T["params"]>
	: null;
type GetSearchParams<T extends PageProps | null> = T extends {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
	? Awaited<T["searchParams"]>
	: null;

type PathBuilder<
	T extends PageProps | null,
	P = GetParams<T>,
	SP = GetSearchParams<T>,
> = T extends null
	? () => string
	: P extends null
		? (searchParams?: SP) => string
		: SP extends null
			? (params: P) => string
			: (params: P, searchParams?: SP) => string;

// Props 需包含 Pages 的每一项
type Assert<T extends Record<Pages, PageProps | null>> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ = Assert<Props>;
