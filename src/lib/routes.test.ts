import { buildSearchParams } from "./routes";

describe("buildSearchParams", () => {
	it("当 searchParams 为 undefined 时返回空串", () => {
		const result = buildSearchParams();
		expect(result).toBe("");
	});

	it("当 searchParams 为空对象时返回空串", () => {
		const result = buildSearchParams({});
		expect(result).toBe("");
	});

	it("处理单个字符串参数", () => {
		const result = buildSearchParams({ search: "test" });
		expect(result).toBe("?search=test");
	});

	it("处理多个字符串参数", () => {
		const result = buildSearchParams({ search: "test", category: "movies" });
		expect(result).toBe("?search=test&category=movies");
	});

	it("处理数组参数", () => {
		const result = buildSearchParams({ tags: ["action", "drama"] });
		expect(result).toBe("?tags=action&tags=drama");
	});

	it("处理字符串和数组的混合参数", () => {
		const result = buildSearchParams({
			search: "test",
			tags: ["action", "drama"],
			category: "movies",
		});
		expect(result).toBe("?search=test&tags=action&tags=drama&category=movies");
	});

	it("过滤 undefined 值", () => {
		const result = buildSearchParams({
			search: "test",
			category: undefined,
			tags: ["action"],
		});
		expect(result).toBe("?search=test&tags=action");
	});

	it("过滤 null 值", () => {
		const result = buildSearchParams({
			search: "test",
			category: null as any,
			tags: ["action"],
		});
		expect(result).toBe("?search=test&tags=action");
	});

	it("过滤空串", () => {
		const result = buildSearchParams({
			search: "test",
			category: "",
			tags: ["action"],
		});
		expect(result).toBe("?search=test&tags=action");
	});

	it("从数组中过滤 null/undefined/空串", () => {
		const result = buildSearchParams({
			search: "test",
			tags: ["action", undefined, "", null, "drama"] as any,
		});
		expect(result).toBe("?search=test&tags=action&tags=drama");
	});

	it("处理值中的特殊字符", () => {
		const result = buildSearchParams({
			search: "test & special chars",
			category: "sci-fi",
		});
		expect(result).toBe("?search=test+%26+special+chars&category=sci-fi");
	});

	it("处理空数组", () => {
		const result = buildSearchParams({ search: "test", tags: [] });
		expect(result).toBe("?search=test");
	});

	it("处理所有值都为 null/undefined/空串 的数组", () => {
		const result = buildSearchParams({
			search: "test",
			tags: [undefined, null, ""] as any,
		});
		expect(result).toBe("?search=test");
	});

	it("保持参数顺序的一致性", () => {
		const params = { b: "second", a: "first", c: "third" };
		const result = buildSearchParams(params);
		// URLSearchParams 会按照添加的顺序保持参数
		expect(result).toBe("?b=second&a=first&c=third");
	});
});
