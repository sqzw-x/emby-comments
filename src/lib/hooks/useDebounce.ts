"use client";

import { useState, useEffect } from "react";

/**
 * 用于防抖的自定义Hook，可以防止函数在短时间内被多次调用
 * @param value 需要防抖的值
 * @param delay 延迟时间，单位毫秒，默认500ms
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 在下一次effect运行前清除定时器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
