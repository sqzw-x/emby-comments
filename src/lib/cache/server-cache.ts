import { EmbyServer } from "@prisma/client";

import { ServerService } from "../service/server";
import { CacheManager } from "./manager";

// 创建专门用于 ActiveServer 的缓存实例
const activeServerCache = new CacheManager<EmbyServer>();

export const getActiveServerCached = () =>
  activeServerCache.get(
    async () => (await new ServerService().getAllServers()).find((server) => server.isActive) ?? null
  );
// 手动更新缓存
export async function updateActiveServerCache(server: EmbyServer | null) {
  activeServerCache.set(server);
}

// 清除缓存
export function clearActiveServerCache() {
  activeServerCache.clear();
}

// 导出通用缓存管理器，以便其他模块可以创建自己的缓存
export { CacheManager };
