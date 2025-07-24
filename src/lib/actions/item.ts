"use server";
import { itemService } from "../service/item";
import { action } from "./utils";

export const filterLocalItems = action(
	itemService.filterLocalItems.bind(itemService),
);

export const getAllLocalItems = action(
	itemService.getAllLocalItems.bind(itemService),
);

/**
 * 批量删除本地项目
 */
export const batchDeleteLocalItems = action(
	itemService.batchDeleteLocalItems.bind(itemService),
);

/**
 * 批量为项目添加标签
 */
export const batchAddTagsToItems = action(
	itemService.batchAddTagsToItems.bind(itemService),
);

/**
 * 批量从项目移除标签
 */
export const batchRemoveTagsFromItems = action(
	itemService.batchRemoveTagsFromItems.bind(itemService),
);
