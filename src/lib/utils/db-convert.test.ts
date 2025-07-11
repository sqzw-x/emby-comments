import {
  arrayToDbString,
  dbStringToArray,
  dbStringToJson,
  dbStringToJsonWithValidation,
  dbStringToMap,
  dbStringToObject,
  dbStringToSet,
  jsonToDbString,
  mapToDbString,
  objectToDbString,
  setToDbString,
} from "./db-convert";

describe("数据库转换辅助函数", () => {
  describe("arrayToDbString", () => {
    it("应该正确转换数组为字符串", () => {
      expect(arrayToDbString(["a", "b", "c"])).toBe('["a","b","c"]');
      expect(arrayToDbString([1, 2, 3])).toBe("[1,2,3]");
      expect(arrayToDbString([{ id: 1 }, { id: 2 }])).toBe('[{"id":1},{"id":2}]');
    });

    it("应该处理空数组", () => {
      expect(arrayToDbString([])).toBe(null);
    });

    it("应该处理 null 和 undefined", () => {
      expect(arrayToDbString(null)).toBe(null);
      expect(arrayToDbString(undefined)).toBe(null);
    });
  });

  describe("dbStringToArray", () => {
    it("应该正确转换字符串为数组", () => {
      expect(dbStringToArray('["a","b","c"]')).toEqual(["a", "b", "c"]);
      expect(dbStringToArray("[1,2,3]")).toEqual([1, 2, 3]);
      expect(dbStringToArray<{ id: number }>('[{"id":1},{"id":2}]')).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToArray(null)).toEqual([]);
      expect(dbStringToArray("")).toEqual([]);
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToArray("invalid json")).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse array from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("应该处理非数组的 JSON 数据", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToArray('{"key": "value"}')).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse array from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("mapToDbString", () => {
    it("应该正确转换 Map 为字符串", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      expect(mapToDbString(map)).toBe('[["key1","value1"],["key2","value2"]]');
    });

    it("应该处理空 Map", () => {
      expect(mapToDbString(new Map())).toBe(null);
    });

    it("应该处理 null 和 undefined", () => {
      expect(mapToDbString(null)).toBe(null);
      expect(mapToDbString(undefined)).toBe(null);
    });

    it("应该处理非 Map 对象", () => {
      // 类型断言用于测试运行时行为
      expect(mapToDbString({} as any)).toBe(null);
    });
  });

  describe("dbStringToMap", () => {
    it("应该正确转换字符串为 Map", () => {
      const result = dbStringToMap('[["key1","value1"],["key2","value2"]]');
      expect(result).toEqual(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ])
      );
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToMap(null)).toEqual(new Map());
      expect(dbStringToMap("")).toEqual(new Map());
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToMap("invalid json")).toEqual(new Map());
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse Map from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("应该处理非数组的 JSON 数据", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToMap('{"key": "value"}')).toEqual(new Map());
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse Map from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("objectToDbString", () => {
    it("应该正确转换对象为字符串", () => {
      const obj = { name: "test", value: 123 };
      expect(objectToDbString(obj)).toBe('{"name":"test","value":123}');
    });

    it("应该处理空对象", () => {
      expect(objectToDbString({})).toBe(null);
    });

    it("应该处理 null 和 undefined", () => {
      expect(objectToDbString(null)).toBe(null);
      expect(objectToDbString(undefined)).toBe(null);
    });

    it("应该处理非对象类型", () => {
      expect(objectToDbString([] as any)).toBe(null);
      expect(objectToDbString("string" as any)).toBe(null);
      expect(objectToDbString(123 as any)).toBe(null);
    });
  });

  describe("dbStringToObject", () => {
    it("应该正确转换字符串为对象", () => {
      expect(dbStringToObject('{"name":"test","value":123}')).toEqual({
        name: "test",
        value: 123,
      });
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToObject(null)).toBe(null);
      expect(dbStringToObject("")).toBe(null);
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToObject("invalid json")).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse object from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("应该处理非对象的 JSON 数据", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToObject('["array"]')).toBe(null);
      expect(dbStringToObject('"string"')).toBe(null);
      expect(dbStringToObject("123")).toBe(null);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });
  });

  describe("jsonToDbString", () => {
    it("应该正确转换各种数据类型为字符串", () => {
      expect(jsonToDbString("test")).toBe('"test"');
      expect(jsonToDbString(123)).toBe("123");
      expect(jsonToDbString(true)).toBe("true");
      expect(jsonToDbString({ key: "value" })).toBe('{"key":"value"}');
      expect(jsonToDbString([1, 2, 3])).toBe("[1,2,3]");
    });

    it("应该处理 null 和 undefined", () => {
      expect(jsonToDbString(null)).toBe(null);
      expect(jsonToDbString(undefined)).toBe(null);
    });
  });

  describe("dbStringToJson", () => {
    it("应该正确转换字符串为各种数据类型", () => {
      expect(dbStringToJson('"test"', "fallback")).toBe("test");
      expect(dbStringToJson("123", 0)).toBe(123);
      expect(dbStringToJson("true", false)).toBe(true);
      expect(dbStringToJson('{"key":"value"}', {})).toEqual({ key: "value" });
      expect(dbStringToJson("[1,2,3]", [])).toEqual([1, 2, 3]);
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToJson(null, "fallback")).toBe("fallback");
      expect(dbStringToJson("", "fallback")).toBe("fallback");
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToJson("invalid json", "fallback")).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse JSON from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("dbStringToJsonWithValidation", () => {
    const isString = (data: unknown): data is string => typeof data === "string";
    const isNumber = (data: unknown): data is number => typeof data === "number";
    const isUser = (data: unknown): data is { id: number; name: string } =>
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      "name" in data &&
      typeof (data as any).id === "number" &&
      typeof (data as any).name === "string";

    it("应该正确转换并验证数据", () => {
      expect(dbStringToJsonWithValidation('"test"', isString, "fallback")).toBe("test");
      expect(dbStringToJsonWithValidation("123", isNumber, 0)).toBe(123);
      expect(dbStringToJsonWithValidation('{"id":1,"name":"test"}', isUser, { id: 0, name: "" })).toEqual({
        id: 1,
        name: "test",
      });
    });

    it("应该处理验证失败的情况", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      expect(dbStringToJsonWithValidation("123", isString, "fallback")).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalledWith("Data validation failed for database string");
      consoleSpy.mockRestore();
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToJsonWithValidation(null, isString, "fallback")).toBe("fallback");
      expect(dbStringToJsonWithValidation("", isString, "fallback")).toBe("fallback");
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToJsonWithValidation("invalid json", isString, "fallback")).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse JSON from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("setToDbString", () => {
    it("应该正确转换 Set 为字符串", () => {
      const set = new Set(["a", "b", "c"]);
      expect(setToDbString(set)).toBe('["a","b","c"]');
    });

    it("应该处理空 Set", () => {
      expect(setToDbString(new Set())).toBe(null);
    });

    it("应该处理 null 和 undefined", () => {
      expect(setToDbString(null)).toBe(null);
      expect(setToDbString(undefined)).toBe(null);
    });

    it("应该处理非 Set 对象", () => {
      // 类型断言用于测试运行时行为
      expect(setToDbString({} as any)).toBe(null);
    });
  });

  describe("dbStringToSet", () => {
    it("应该正确转换字符串为 Set", () => {
      const result = dbStringToSet('["a","b","c"]');
      expect(result).toEqual(new Set(["a", "b", "c"]));
    });

    it("应该处理空字符串和 null", () => {
      expect(dbStringToSet(null)).toEqual(new Set());
      expect(dbStringToSet("")).toEqual(new Set());
    });

    it("应该处理无效的 JSON 字符串", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToSet("invalid json")).toEqual(new Set());
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse Set from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("应该处理非数组的 JSON 数据", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(dbStringToSet('{"key": "value"}')).toEqual(new Set());
      expect(consoleSpy).toHaveBeenCalledWith("Failed to parse Set from database string:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("往返转换测试", () => {
    it("数组往返转换应该保持数据一致", () => {
      const original = ["a", "b", "c"];
      const dbString = arrayToDbString(original);
      const result = dbStringToArray(dbString);
      expect(result).toEqual(original);
    });

    it("Map 往返转换应该保持数据一致", () => {
      const original = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const dbString = mapToDbString(original);
      const result = dbStringToMap(dbString);
      expect(result).toEqual(original);
    });

    it("对象往返转换应该保持数据一致", () => {
      const original = { name: "test", value: 123 };
      const dbString = objectToDbString(original);
      const result = dbStringToObject(dbString);
      expect(result).toEqual(original);
    });

    it("Set 往返转换应该保持数据一致", () => {
      const original = new Set(["a", "b", "c"]);
      const dbString = setToDbString(original);
      const result = dbStringToSet(dbString);
      expect(result).toEqual(original);
    });

    it("JSON 往返转换应该保持数据一致", () => {
      const original = { array: [1, 2, 3], string: "test", number: 123 };
      const dbString = jsonToDbString(original);
      const result = dbStringToJson(dbString, {});
      expect(result).toEqual(original);
    });
  });
});
