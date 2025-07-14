"use server";

import { clearActiveServerCache, getActiveServerCached, updateActiveServerCache } from "../cache/server-cache";
import { EmbyClient } from "../sdk/emby";
import { itemService } from "../service/item";
import { ServerCreateData, serverService } from "../service/server";
import { action } from "./utils";

/**
 * 获取所有服务器
 */
export const getAllServers = action(serverService.getAllServers.bind(serverService));

/**
 * 获取服务器详情
 */
export const getServerById = action(serverService.getServerById.bind(serverService));

/**
 * 获取激活的服务器
 */
export const getActiveServer = action(getActiveServerCached);

/**
 * 创建服务器
 */
export const createServer = action(async (data: ServerCreateData) => {
  if (!data.name || !data.url || !data.apiKey) {
    throw new Error("缺少必要字段");
  }
  const server = await serverService.createServer(data);
  // 如果创建的是活动服务器，更新缓存
  if (server.isActive) {
    await updateActiveServerCache(server);
  }
  return server;
});

/**
 * 更新服务器
 */
export const updateServer = action(async (id: number, data: Partial<ServerCreateData>) => {
  if (Object.keys(data).length === 0) {
    throw new Error("没有提供要更新的字段");
  }
  // 如果将此服务器设为活动状态，先将其他所有服务器设为非活动状态
  if (data.isActive === true) {
    const allServers = await serverService.getAllServers();
    for (const server of allServers) {
      if (server.id !== id && server.isActive) {
        await serverService.updateServer(server.id, { isActive: false });
      }
    }
  }
  const server = await serverService.updateServer(id, data);
  // 根据激活状态更新缓存
  if (data.isActive !== undefined) {
    if (data.isActive) {
      await updateActiveServerCache(server);
    } else {
      // 如果当前缓存的是这个服务器，并且被设置为非活动，清除缓存
      const cachedServer = await getActiveServerCached();
      if (cachedServer && cachedServer.id === id) {
        clearActiveServerCache();
      }
    }
  }
  // 如果更新了激活状态，提供对应的消息
  let message = "服务器已更新";
  if (data.isActive !== undefined) {
    message = data.isActive ? "服务器已激活" : "服务器已停用";
  }
  return { server, message };
});

/**
 * 删除服务器
 */
export const deleteServer = action(async (id: number) => {
  // 先检查是否是活动服务器
  const cachedServer = await getActiveServerCached();
  await serverService.deleteServer(id);
  // 如果删除的是活动服务器，清除缓存
  if (cachedServer && cachedServer.id === id) {
    clearActiveServerCache();
  }
});

/**
 * 测试服务器连接
 */
export const testServerConnection = action(async (url: string, apiKey: string) => {
  const tempClient = new EmbyClient({ url, apiKey, name: "test", isActive: false });
  return await tempClient.testConnection();
});

/**
 * 同步服务器数据
 */
export const syncServer = action(itemService.syncEmby.bind(itemService));

/**
 * 批量操作
 */
export const batchProcessMappings = action(itemService.batchProcessMappings.bind(itemService));

/**
 * 获取未映射的本地项目
 */
export const getUnmappedLocalItems = action(itemService.getUnmappedLocalItems.bind(itemService));
