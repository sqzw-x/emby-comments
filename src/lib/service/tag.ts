import { Prisma } from "@prisma/client";

import { dbClient } from "../db/prisma";

export type TagWithCount = Prisma.TagGetPayload<{ include: { _count: { select: { items: true } } } }>;

/**
 * 标签服务类，处理标签的增删改查
 */
export class TagService {
  /**
   * 检查是否存在指定名称的标签
   */
  async tagExists(name: string) {
    const existingTag = await dbClient.tag.findFirst({ where: { name } });
    return !!existingTag;
  }
  /**
   * 获取项目的所有标签
   */
  async getTagsByItemId(localItemId: number) {
    const localItem = await dbClient.localItem.findUnique({ where: { id: localItemId }, include: { tags: true } });
    return localItem?.tags || [];
  }

  /**
   * 更新标签
   */
  async updateTag(id: number, name: string, description?: string, group?: string) {
    // 检查标签名是否已存在
    const existingTag = await dbClient.tag.findFirst({ where: { name, id: { not: id } } });
    if (existingTag) {
      throw new Error(`标签名 "${name}" 已存在，请使用其他名称。`);
    }
    return dbClient.tag.update({ where: { id }, data: { name, description, group } });
  }

  /**
   * 为项目添加标签, 标签不存在时自动创建
   */
  async addTagToItem(localItemId: number, tagName: string) {
    // 查找或创建标签
    let tag = await dbClient.tag.findFirst({ where: { name: tagName } });
    if (!tag) {
      tag = await dbClient.tag.create({ data: { name: tagName } });
    }
    // 创建项目标签关联
    await dbClient.localItem.update({ where: { id: localItemId }, data: { tags: { connect: { id: tag.id } } } });
    return tag;
  }

  /**
   * 从项目移除标签
   */
  async removeTagFromItem(localItemId: number, tagId: number) {
    return dbClient.localItem.update({ where: { id: localItemId }, data: { tags: { disconnect: { id: tagId } } } });
  }

  /**
   * 创建标签
   */
  async createTag(name: string, description?: string, group?: string) {
    return dbClient.tag.create({ data: { name, description, group } });
  }

  /**
   * 删除标签
   */
  async deleteTag(id: number) {
    // 删除标签 (多对多关系会自动处理)
    return dbClient.tag.delete({ where: { id } });
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<TagWithCount[]> {
    return await dbClient.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    });
  }

  /**
   * 搜索标签
   */
  async searchTags(query: string) {
    if (!query) {
      return this.getAllTags();
    }
    return dbClient.tag.findMany({ where: { name: { contains: query.toLowerCase() } }, orderBy: { name: "asc" } });
  }

  /**
   * 获取特定服务器相关的所有标签
   * @param serverId 服务器ID
   * @param orderBy 排序方式, 可按名称或项目数量排序, 默认按项目数量
   */
  async getTagsByServerId(serverId: number, orderBy: "name" | "count" = "count"): Promise<TagWithCount[]> {
    const order: Prisma.TagOrderByWithRelationInput =
      orderBy === "count" ? { items: { _count: "desc" } } : { name: "asc" };
    return await dbClient.tag.findMany({
      where: { items: { some: { embyItems: { some: { embyServerId: serverId } } } } },
      include: { _count: { select: { items: true } } },
      orderBy: order,
    });
  }

  /**
   * 根据标签ID获取标签详情，包括关联的项目
   */
  async getTagWithItems(tagId: number, serverId?: number) {
    const tag = await dbClient.tag.findUnique({
      where: { id: tagId },
      include: {
        items: {
          where: serverId ? { embyItems: { some: { embyServerId: serverId } } } : {},
          include: { tags: true, rating: true, embyItems: serverId ? { where: { embyServerId: serverId } } : true },
        },
        _count: { select: { items: true } },
      },
    });

    if (!tag) return null;

    return {
      ...tag,
      count: tag._count.items,
      items: tag.items.map((item) => ({
        ...item,
        embyItem: Array.isArray(item.embyItems)
          ? item.embyItems.length > 0
            ? item.embyItems[0]
            : null
          : item.embyItems,
      })),
    };
  }

  /**
   * 将与指定 genre 同名的 tag 添加到所有包含此 genre 的 EmbyItem 关联的 LocalItem
   */
  async addTagByGenre(genre: string, serverId?: number) {
    // 1. 检查是否已存在同名标签
    let tag = await dbClient.tag.findFirst({ where: { name: genre } });
    if (!tag) {
      // 如果不存在，则创建新标签
      tag = await dbClient.tag.create({ data: { name: genre } });
    }
    // 2. 查找所有具有此 genre 的 EmbyItem
    // genres 存储为 json 数组字符串, 因此可以使用双引号包裹的字符串进行匹配
    const embyItems = await dbClient.embyItem.findMany({
      where: { genres: { contains: `"${genre}"` }, embyServerId: serverId },
      include: { localItem: true },
    });
    // 3. 将标签添加到所有关联的 LocalItem
    for (const embyItem of embyItems) {
      if (embyItem.localItemId) {
        await dbClient.localItem.update({
          where: { id: embyItem.localItemId },
          data: { tags: { connect: { id: tag.id } } },
        });
      }
    }
    return tag;
  }

  /**
   * 批量设置标签分组
   */
  async batchSetTagGroup(tagIds: number[], group: string) {
    return dbClient.tag.updateMany({
      where: { id: { in: tagIds } },
      data: { group },
    });
  }

  /**
   * 批量删除标签
   */
  async batchDeleteTags(tagIds: number[]) {
    return dbClient.tag.deleteMany({ where: { id: { in: tagIds } } });
  }

  /**
   * 合并多个标签到一个目标标签
   * @param ids 待合并的标签ID列表
   * @param targetTagId 目标标签ID，将所有源标签关联的项目转移到此标签
   */
  async mergeTags(ids: number[], targetTagId: number) {
    return await dbClient.$transaction(async (tx) => {
      // 1. 获取所有标签关联的项目
      const sourceTagItems = await tx.localItem.findMany({
        where: { tags: { some: { id: { in: ids } } } },
        include: { tags: true },
      });
      // 2. 为每个项目添加目标标签（如果还没有）
      for (const item of sourceTagItems) {
        const hasTargetTag = item.tags.some((tag) => tag.id === targetTagId);
        if (!hasTargetTag) {
          await tx.localItem.update({ where: { id: item.id }, data: { tags: { connect: { id: targetTagId } } } });
        }
      }
      // 3. 获取标签描述信息
      const sourceTags = await tx.tag.findMany({ where: { id: { in: [...ids, targetTagId] } } });
      let desc = "";
      for (const tag of sourceTags) {
        if (tag.description) {
          desc += `${tag.name}: ${tag.description}\n`;
        }
      }
      // 4. 更新目标标签的描述信息
      await tx.tag.update({ where: { id: targetTagId }, data: { description: desc } });
      // 5. 删除源标签
      await tx.tag.deleteMany({ where: { id: { in: ids } } });
    });
  }
}

export const tagService = new TagService(); // 扩展Tag类型以包含itemCount属性
