"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Config, ConfigKey, DEFAULT_CONFIG, mergeConfig } from "../service/config";
import {
  setConfig as setConfigAction,
  deleteConfigKey as deleteConfigKeyAction,
  resetConfig as resetConfigAction,
} from "../actions/config";
import { useLocalStorage } from "../hooks/useLocalStorage";

type ConfigContextType = {
  config: Config;
  setConfig: (config: Partial<Config>) => Promise<void>;
  setConfigKey: <T extends ConfigKey>(key: T, value: Config[T]) => Promise<void>;
  deleteConfigKey: (key: ConfigKey) => Promise<void>;
  resetConfig: () => Promise<void>;
  isLoading: boolean;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children, initial }: { children: React.ReactNode; initial: Config }) {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfigState] = useLocalStorage<Config>("config", initial);

  // 更新配置
  const setConfig = useCallback(
    async (newConfig: Partial<Config>) => {
      setIsLoading(true);
      // 调用action更新配置
      const result = await setConfigAction(newConfig);
      if (result.success) {
        // 使用类型安全的合并函数更新本地状态
        const updatedConfig = mergeConfig(config, newConfig);
        setConfigState(updatedConfig);
      } else {
        console.error("更新配置失败:", result.message);
      }
      setIsLoading(false);
    },
    [config, setConfigState]
  );

  // 更新单个配置项
  const setConfigKey = useCallback(
    async <T extends ConfigKey>(key: T, value: Config[T]) => await setConfig({ [key]: value }),
    [setConfig]
  );

  // 删除配置项
  const deleteConfigKey = useCallback(
    async (key: ConfigKey) => {
      setIsLoading(true);
      const result = await deleteConfigKeyAction(key);
      if (result.success) {
        // 恢复为默认值
        const resetUpdate = { [key]: DEFAULT_CONFIG[key] };
        const updatedConfig = mergeConfig(config, resetUpdate);
        setConfigState(updatedConfig);
      } else {
        console.error("删除配置失败:", result.message);
      }
      setIsLoading(false);
    },
    [config, setConfigState]
  );

  // 重置所有配置
  const resetConfig = useCallback(async () => {
    setIsLoading(true);
    const result = await resetConfigAction();
    if (result.success) {
      // 更新本地状态为默认值
      setConfigState(DEFAULT_CONFIG);
    } else {
      console.error("重置配置失败:", result.message);
    }
    setIsLoading(false);
  }, [setConfigState]);

  return (
    <ConfigContext.Provider value={{ config, setConfig, setConfigKey, deleteConfigKey, resetConfig, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfigContext必须在ConfigProvider内部使用");
  }
  return context;
}
