import { Config, ConfigKey, configService, DEFAULT_CONFIG, mergeConfig } from "../service/config";
import { CacheManager } from "./manager";

// 配置缓存管理器
const configCacheManager = new CacheManager<Config>();

/**
 * 获取配置
 */
export async function getConfigCached(): Promise<Config> {
  const result = await configCacheManager.get(configService.getConfig);
  return result ?? DEFAULT_CONFIG;
}

/**
 * 设置配置
 */
export async function setConfigCached(config: Partial<Config>): Promise<void> {
  await configService.setConfig(config);
  const cur = await getConfigCached();
  // 更新各个配置项
  configCacheManager.set(mergeConfig(cur, config));
}

/**
 * 删除配置并清除缓存
 */
export async function deleteConfigKeyCached(key: ConfigKey): Promise<void> {
  await configService.deleteConfigKey(key);
  configCacheManager.clear();
}

/**
 * 重置所有配置并清除缓存
 */
export async function resetConfigCached(): Promise<void> {
  await configService.resetConfig();
  configCacheManager.clear();
}
