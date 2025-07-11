import { format } from "date-fns";

/**
 * 将日期格式化为标准中文格式
 * 例如: 2025年4月29日 14:30:45
 *
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDateToChinese(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, "yyyy年MM月dd日 HH:mm:ss");
}

/**
 * 将日期格式化为简短格式
 * 例如: 2025-04-29
 *
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDateShort(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, "yyyy-MM-dd");
}

/**
 * 获取相对时间描述
 * 例如: 刚刚、5分钟前、1小时前、昨天、3天前
 *
 * @param date 日期对象或日期字符串
 * @returns 相对时间描述
 */
export function getRelativeTimeString(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return "刚刚";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  if (diffInSeconds < 172800) return "昨天";
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`;

  return formatDateShort(dateObj);
}
