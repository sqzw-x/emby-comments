"use server";

import { tagService } from "../service/tag";
import { action } from "./utils";

/**
 * 检查是否存在指定名称的标签
 */
export const tagExists = action(tagService.tagExists.bind(tagService));

/**
 * 获取服务器下所有标签
 */
export const getTagsByServerId = action(
	tagService.getTagsByServerId.bind(tagService),
);

/**
 * 根据标签ID获取标签详情和关联项目
 */
export const getTagWithItems = action(
	tagService.getTagWithItems.bind(tagService),
);

/**
 * 创建新标签
 */
export const createTag = action(tagService.createTag.bind(tagService));

/**
 * 为项目添加标签, 标签不存在时自动创建
 */
export const addTagToItem = action(tagService.addTagToItem.bind(tagService));

/**
 * 从项目移除标签
 */
export const removeTagFromItem = action(
	tagService.removeTagFromItem.bind(tagService),
);

/**
 * 更新标签
 */
export const updateTag = action(tagService.updateTag.bind(tagService));

/**
 * 删除标签
 */
export const deleteTag = action(tagService.deleteTag.bind(tagService));

export const addTagByGenre = action(tagService.addTagByGenre.bind(tagService));

/**
 * 获取所有标签
 */
export const getAllTags = action(tagService.getAllTags.bind(tagService));

/**
 * 批量设置标签分组
 */
export const batchSetTagGroup = action(
	tagService.batchSetTagGroup.bind(tagService),
);

/**
 * 批量删除标签
 */
export const batchDeleteTags = action(
	tagService.batchDeleteTags.bind(tagService),
);

/**
 * 合并标签
 */
export const mergeTags = action(tagService.mergeTags.bind(tagService));
