/**
 * 使 T 的所有属性可选，并且可以为 null.
 * 当 null 是一个有效值时非常有用.
 */
export type NullablePartial<T> = {
	[P in keyof T]?: T[P] | null;
};

/**
 * 当 v 是 undefined 时返回 raw，否则返回 v.
 *
 * 可用于更新数据. 如果某个字段未提供, 则使用原始值. 特别的, null 将被视为有效值 (即清除原始值).
 */
export function getNew<T>(
	v: T | undefined | null,
	raw: T | undefined,
): T | undefined {
	return v === undefined ? raw : (v ?? undefined);
}
