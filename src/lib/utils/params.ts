// 将前后端直接使用的类型转换为可通过 URL 传递的类型
// - number 类型转换为 string
// - 当 query params 类型中有 string[] 时, 如果只有一个元素, server 端解析 url 时会变成 string, 需提醒进行处理
export type SafeSearchParam<
	T extends Record<string, string | number | number[] | string[] | undefined>,
> = {
	[K in keyof T]: NumberToString<string[] extends T[K] ? string | T[K] : T[K]>;
};

type NumberToString<T> = T extends number
	? string
	: T extends number[]
		? string[]
		: T;

// 辅助类型：识别需要转换的字段
export type NumberFields<T> = {
	[K in keyof T]: number extends T[K] ? K : never;
}[keyof T];

export type NumberArrayFields<T> = {
	[K in keyof T]: number[] extends T[K] ? K : never;
}[keyof T];

export type StringArrayFields<T> = {
	[K in keyof T]: string[] extends T[K] ? K : never;
}[keyof T];

// 字段转换配置类型
export interface ParamConfig<
	T extends Record<string, string | number | number[] | string[] | undefined>,
> {
	/** 需要转换为 number 的字段 */
	numberFields?: NumberFields<T>[];
	/** 需要转换为 number[] 的字段 */
	numberArrayFields?: NumberArrayFields<T>[];
	/** 需要确保为数组的 string[] 字段 */
	stringArrayFields?: StringArrayFields<T>[];
}

// 转换函数
export function parseSearchParams<
	T extends Record<string, string | number | number[] | string[] | undefined>,
>(params: SafeSearchParam<T>, config: ParamConfig<T>): T {
	const result = { ...params } as unknown as T;

	// 转换 number 字段
	if (config.numberFields) {
		for (const field of config.numberFields) {
			const value = result[field];
			if (typeof value === "string") {
				const parsed = parseInt(value);
				if (!Number.isNaN(parsed)) {
					(result[field] as unknown) = parsed;
				}
			}
		}
	}

	// 转换 number[] 字段
	if (config.numberArrayFields) {
		for (const field of config.numberArrayFields) {
			const value = result[field];
			if (typeof value === "string") {
				// 单个字符串转为数组
				const parsed = Number(value);
				if (!Number.isNaN(parsed)) {
					(result[field] as unknown) = [parsed];
				}
			} else if (Array.isArray(value)) {
				// 数组中的字符串转为数字
				(result[field] as unknown) = value.map((v) => {
					const parsed = Number(v);
					return Number.isNaN(parsed) ? v : parsed;
				});
			}
		}
	}

	// 确保 string[] 字段为数组
	if (config.stringArrayFields) {
		for (const field of config.stringArrayFields) {
			const value = result[field];
			if (typeof value === "string") {
				(result[field] as unknown) = [value];
			}
		}
	}

	return result;
}

export function toSearchParams<
	T extends Record<string, string | number | number[] | string[] | undefined>,
>(params: T): SafeSearchParam<T> {
	const result = { ...params } as Record<string, string | string[] | undefined>;

	// 遍历所有字段，自动转换 number 和 number[] 类型
	for (const [key, value] of Object.entries(params)) {
		if (typeof value === "number") {
			// 转换 number 为 string
			result[key] = value.toString();
		} else if (
			Array.isArray(value) &&
			value.length > 0 &&
			typeof value[0] === "number"
		) {
			// 转换 number[] 为 string[]
			result[key] = value.map((v) => v.toString());
		}
	}

	return result as SafeSearchParam<T>;
}
