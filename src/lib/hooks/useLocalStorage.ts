"use client";

import { useEffect, useState } from "react";

/**
 * 使用localStorage存储和获取状态的自定义Hook
 * @param key localStorage的键名
 * @param initialValue 初始值
 * @returns [存储的值, 设置值的函数]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 状态管理 - 在客户端初始化时使用 initialValue，然后在 useEffect 中同步
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // 在客户端挂载后同步 localStorage 的值
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedValue = JSON.parse(item);
          setStoredValue(parsedValue);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        setIsInitialized(true);
      }
    }
  }, [key, isInitialized]);

  // 设置localStorage的值
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 监听其他窗口/标签页的localStorage变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
