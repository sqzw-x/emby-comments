"use server";

import { deleteConfigKeyCached, getConfigCached, resetConfigCached, setConfigCached } from "../cache/config-cache";
import { action } from "./utils";

/**
 * 获取配置
 */
export const getConfig = action(getConfigCached);

/**
 * 设置配置
 */
export const setConfig = action(setConfigCached);

/**
 * 删除配置项
 */
export const deleteConfigKey = action(deleteConfigKeyCached);

/**
 * 重置所有配置
 */
export const resetConfig = action(resetConfigCached);
