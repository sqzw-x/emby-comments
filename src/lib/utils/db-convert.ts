/**
 * 数据库转换辅助函数
 * 用于在数据库中以字符串形式存储复杂数据类型，并实现反向转换
 */

/**
 * 将数组转换为数据库存储的字符串
 * @param array 要转换的数组
 * @returns 字符串形式的数组数据
 */
export function arrayToDbString<T>(array?: T[] | null): string | null {
  if (!array) {
    return null;
  }
  return JSON.stringify(array);
}

/**
 * 将数据库字符串转换为数组
 * @param dbString 数据库中的字符串
 * @returns 转换后的数组
 */
export function dbStringToArray<T = string>(dbString: string | null): T[] {
  if (!dbString) {
    return [];
  }

  try {
    const parsed = JSON.parse(dbString);
    if (!Array.isArray(parsed)) {
      console.warn("Parsed data is not an array:", parsed);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse array from database string:", error);
    return [];
  }
}

/**
 * 将Map转换为数据库存储的字符串
 * @param map 要转换的Map对象
 * @returns 字符串形式的Map数据
 */
export function mapToDbString<K = string, V = string>(map?: Map<K, V> | null): string | null {
  if (!map || !(map instanceof Map)) {
    return null;
  }
  // 将Map转换为数组形式存储
  const arrayData = Array.from(map.entries());
  return JSON.stringify(arrayData);
}

/**
 * 将数据库字符串转换为Map
 * @param dbString 数据库中的字符串
 * @returns 转换后的Map对象
 */
export function dbStringToMap<K = string, V = string>(dbString: string | null): Map<K, V> {
  if (!dbString) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(dbString);
    if (!Array.isArray(parsed)) {
      console.warn("Parsed data is not an array:", parsed);
      return new Map();
    }
    return new Map(parsed);
  } catch (error) {
    console.error("Failed to parse Map from database string:", error);
    return new Map();
  }
}

/**
 * 将对象转换为数据库存储的字符串
 * @param obj 要转换的对象
 * @returns 字符串形式的对象数据
 */
export function objectToDbString<T extends Record<string, unknown>>(obj?: T | null): string | null {
  if (!obj || typeof obj !== "object") {
    return null;
  }
  // 检查对象是否为空对象
  if (Object.keys(obj).length === 0) {
    return null;
  }
  return JSON.stringify(obj);
}

/**
 * 将数据库字符串转换为对象
 * @param dbString 数据库中的字符串
 * @returns 转换后的对象
 */
export function dbStringToObject<T extends Record<string, unknown>>(dbString: string | null): T | null {
  if (!dbString) {
    return null;
  }

  try {
    const parsed = JSON.parse(dbString);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      console.warn("Parsed data is not a plain object:", parsed);
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse object from database string:", error);
    return null;
  }
}

/**
 * 通用JSON转换函数 - 转换为数据库字符串
 * @param data 要转换的任意数据
 * @returns 字符串形式的数据
 */
export function jsonToDbString(data: unknown): string | null {
  if (data === null || data === undefined) {
    return null;
  }
  return JSON.stringify(data);
}

/**
 * 通用JSON转换函数 - 从数据库字符串转换
 * @param dbString 数据库中的字符串
 * @param fallback 解析失败时的默认值
 * @returns 转换后的数据
 */
export function dbStringToJson<T>(dbString: string | null, fallback: T): T {
  if (!dbString) {
    return fallback;
  }

  try {
    return JSON.parse(dbString);
  } catch (error) {
    console.error("Failed to parse JSON from database string:", error);
    return fallback;
  }
}

/**
 * 安全的JSON解析函数，带有类型检查
 * @param dbString 数据库中的字符串
 * @param validator 类型验证函数
 * @param fallback 解析失败或验证失败时的默认值
 * @returns 转换后的数据
 */
export function dbStringToJsonWithValidation<T>(
  dbString: string | null,
  validator: (data: unknown) => data is T,
  fallback: T
): T {
  if (!dbString) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(dbString);
    if (validator(parsed)) {
      return parsed;
    } else {
      console.warn("Data validation failed for database string:", parsed);
      return fallback;
    }
  } catch (error) {
    console.error("Failed to parse JSON from database string:", error);
    return fallback;
  }
}

/**
 * 将Set转换为数据库存储的字符串
 * @param set 要转换的Set对象
 * @returns 字符串形式的Set数据
 */
export function setToDbString<T = string>(set?: Set<T> | null): string | null {
  if (!set || !(set instanceof Set)) {
    return null;
  }
  // 将Set转换为数组形式存储
  const arrayData = Array.from(set);
  return JSON.stringify(arrayData);
}

/**
 * 将数据库字符串转换为Set
 * @param dbString 数据库中的字符串
 * @returns 转换后的Set对象
 */
export function dbStringToSet<T = string>(dbString: string | null): Set<T> {
  if (!dbString) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(dbString);
    if (!Array.isArray(parsed)) {
      console.warn("Parsed data is not an array:", parsed);
      return new Set();
    }
    return new Set(parsed);
  } catch (error) {
    console.error("Failed to parse Set from database string:", error);
    return new Set();
  }
}
