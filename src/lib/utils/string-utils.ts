/**
 * 计算两个字符串的相似度（0-1之间，1表示完全相同）
 * 使用Levenshtein距离算法
 */
export function compareStrings(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  // 转为小写便于比较
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // 如果完全相同，直接返回1
  if (s1 === s2) return 1;

  // 计算Levenshtein距离
  const distance = levenshteinDistance(s1, s2);

  // 计算相似度
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1; // 两个空字符串视为完全相同

  // 相似度 = 1 - (距离 / 最大长度)
  return 1 - distance / maxLength;
}

/**
 * 计算Levenshtein距离
 * Levenshtein距离是两个字符串之间的编辑距离，表示将一个字符串转换为另一个字符串所需的最少单字符编辑次数
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  // 创建矩阵
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // 初始化
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // 替换
          dp[i][j - 1] + 1, // 插入
          dp[i - 1][j] + 1 // 删除
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 去除字符串中的特殊字符，只保留字母、数字和空格
 */
export function cleanString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 提取字符串中的年份
 */
export function extractYear(str: string): number | null {
  if (!str) return null;
  const match = str.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[0], 10) : null;
}
