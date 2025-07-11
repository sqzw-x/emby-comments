"use server";

import { action } from "@/lib/actions/utils";
import { externalLinkProviderService as service } from "@/lib/service/external-link-provider";

// 获取所有外部链接提供商
export const getAllExternalLinkProviders = action(service.getAllProviders.bind(service));

// 创建外部链接提供商
export const createExternalLinkProvider = action(service.createProvider.bind(service));

// 更新外部链接提供商
export const updateExternalLinkProvider = action(service.updateProvider.bind(service));

// 删除外部链接提供商
export const deleteExternalLinkProvider = action(service.deleteProvider.bind(service));

// 批量更新显示顺序
export const updateExternalLinkProvidersOrder = action(service.updateProvidersOrder.bind(service));

// 初始化默认提供商
export const initDefaultExternalLinkProviders = action(service.initDefaultProviders.bind(service));
