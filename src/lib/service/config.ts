import { dbClient } from "../db/prisma";

// 配置项的类型定义
export interface ConfigItem<T = unknown> {
  key: string;
  value: T;
  defaultValue?: T;
  description?: string;
}

// 配置的默认值
export const DEFAULT_CONFIG = {
  "app.theme": "light" as "light" | "dark" | "system",
  test: "default value",
};

export type Config = typeof DEFAULT_CONFIG;

export type ConfigKey = keyof Config;

// 类型安全的配置更新辅助函数 - 正确处理undefined值
export const mergeConfig = (baseConfig: Config, updates: Partial<Config>): Config => {
  // 过滤掉undefined值，然后进行类型安全的合并
  const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
  return { ...baseConfig, ...filteredUpdates };
};

export class ConfigService {
  /**
   * 获取配置
   */
  async getConfig(): Promise<Config> {
    const configs = await dbClient.config.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_CONFIG };

    for (const config of configs) {
      try {
        result[config.key] = JSON.parse(config.value);
      } catch (parseError) {
        console.error(`解析配置 ${config.key} 失败:`, parseError);
        // 保持默认值
      }
    }
    return result as Config;
  }

  /**
   * 设置配置
   */
  async setConfig(config: Partial<Config>): Promise<void> {
    await dbClient.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined) {
          await tx.config.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) },
          });
        }
      }
    });
  }

  /**
   * 删除配置（恢复为默认值）
   */
  async deleteConfigKey(key: ConfigKey): Promise<void> {
    await dbClient.config.delete({ where: { key } });
  }

  /**
   * 重置所有配置为默认值
   */
  async resetConfig(): Promise<void> {
    await dbClient.config.deleteMany();
  }
}

// 创建全局实例
export const configService = new ConfigService();
