import { EmbyItem, EmbyServer, LocalItem, Prisma, Tag } from "@prisma/client";
import { BaseItem } from "emby-sdk-stainless/resources";
import { dbClient } from "../db/prisma";
import { EmbyClient } from "../sdk/emby";
import { arrayToDbString, dbStringToArray } from "../utils/db-convert";
import { compareStrings } from "../utils/string-utils";

export type LocalItemWithScore = LocalItem & {
  score: number;
};

export type MatchStatus = "exact" | "multiple" | "none" | "matched";

export type ItemSyncResult = {
  item: EmbyItem;
  matches: LocalItemWithScore[];
  status: MatchStatus;
};

export type ItemMapOperation =
  | {
      type: "map";
      embyItemId: number;
      localItemId: number;
    }
  | {
      type: "unmap" | "create";
      embyItemId: number;
    }
  | {
      type: "refresh";
      embyItemId: number;
    };

export type SortField = "title" | "premiereDate" | "rating" | "createdAt" | "updatedAt" | "embyCreatedAt";
export type SortOrder = "asc" | "desc";
export type ItemSearchOptions = {
  search?: string; // 搜索关键词
  yearFrom?: number; // 年份范围开始
  yearTo?: number; // 年份范围结束
  tagIds?: number[]; // 标签列表
  sortBy?: SortField;
  sortOrder?: SortOrder;
};

/**
 * 数据服务，用于管理本地项目与Emby项目的映射和同步
 */
export class ItemService {
  /**
   * 根据 emby API 返回的数据创建或更新 EmbyItem
   */
  async createOrUpdateEmbyItem(serverId: number, embyItem: BaseItem, includeLocalItem = false) {
    // 格式化 genres 和 studios
    const genres = arrayToDbString(embyItem.Genres);
    const studios = arrayToDbString(embyItem.Studios?.map((s) => s.Name));
    const actors = arrayToDbString(embyItem.People?.filter((p) => p.Type === "Actor").map((a) => a.Name));
    const directors = arrayToDbString(embyItem.People?.filter((p) => p.Type === "Director").map((d) => d.Name));

    // 转换日期
    const dateAdded = embyItem.DateCreated ? new Date(embyItem.DateCreated) : null;
    const premiereDate = embyItem.PremiereDate ? new Date(embyItem.PremiereDate) : null;

    const data = {
      title: embyItem.Name!,
      originalTitle: embyItem.OriginalTitle || embyItem.Name,
      overview: embyItem.Overview || null,
      type: embyItem.Type!,
      premiereDate,
      externalIds: embyItem.ProviderIds,
      posterPath: embyItem.ImageTags?.Primary || null,
      backdropPath: embyItem.BackdropImageTags?.[0] || null,
      genres,
      studios,
      actors,
      directors,
      productionYear: embyItem.ProductionYear || premiereDate?.getFullYear() || null,
      dateAdded,
      communityRating: embyItem.CommunityRating || null,
      embyCreateAt: embyItem.DateCreated ? new Date(embyItem.DateCreated) : null, // Emby 上的创建时间
    };
    // 更新或创建Emby项目
    const updatedEmbyItem = await dbClient.embyItem.upsert({
      where: { embyId_embyServerId: { embyId: embyItem.Id!, embyServerId: serverId } },
      update: data,
      create: { embyId: embyItem.Id!, embyServerId: serverId, ...data },
      include: { localItem: includeLocalItem },
    });
    return updatedEmbyItem;
  }

  /**
   * 同步服务器项目并返回同步结果
   */
  async syncEmby(server: EmbyServer): Promise<ItemSyncResult[]> {
    const embyClient = new EmbyClient(server);
    // 获取 emby 的所有项目
    const serverItems = await embyClient.getItems({
      Recursive: true,
      IncludeItemTypes: "Movie,Series",
      Fields: "Overview,Genres,Studios,ProviderIds,DateCreated,People,Path,PremiereDate,ProductionYear",
      SortBy: "Name",
      SortOrder: "Ascending",
    });
    if (!serverItems || serverItems.length === 0) {
      console.debug("未从服务器获取到任何项目");
      return [];
    }
    console.debug(`从服务器获取到 ${serverItems.length} 个项目`);

    // 筛选分段项目
    const [filteredItems] = EmbyClient.filterMultiPartItems(serverItems);
    console.debug(`筛选分段后共 ${filteredItems.length} 个项目`);

    // 根据 serverItem 创建或更新 EmbyItem
    const allEmbyItems = await Promise.all(
      filteredItems.map((item) => this.createOrUpdateEmbyItem(server.id, item, true))
    );
    if (allEmbyItems.length != (await dbClient.embyItem.count({ where: { embyServerId: server.id } }))) {
      // 如果数量不一致，可能是有删除的项目
      // 删除当前服务器上不存在的 ID
      const { count } = await dbClient.embyItem.deleteMany({
        where: { embyServerId: server.id, embyId: { notIn: allEmbyItems.map((item) => item.embyId) } },
      });
      console.debug(`删除了 ${count} 个不存在于服务器的项目`);
    }

    // 获取 localItem, 仅获取在当前服务器上无映射的 localItem
    const allLocalItems = await dbClient.localItem.findMany({
      where: { embyItems: { none: { embyServerId: server.id } } },
    });
    console.debug(`共有 ${allLocalItems.length} 个未与此服务器映射的本地项目`);

    // 进行映射
    return this.matchItems(allLocalItems, allEmbyItems);
  }

  /**
   * 匹配 LocalItem 和 EmbyItem
   */
  private matchItems(
    allLocalItems: LocalItem[],
    allEmbyItems: Prisma.EmbyItemGetPayload<{ include: { localItem: true } }>[]
  ) {
    const matchedLocalItems = new Set();
    const res: ItemSyncResult[] = [];
    const exactMatch = (embyItem: EmbyItem, localItem: LocalItem) => {
      matchedLocalItems.add(localItem.id);
      res.push({ item: embyItem, matches: [{ ...localItem, score: 1 }], status: "exact" });
    };

    out: for (const embyItem of allEmbyItems) {
      if (embyItem.localItem) {
        // 已经映射, 跳过
        res.push({ item: embyItem, matches: [], status: "matched" });
        continue;
      }

      // 精准匹配, 快速返回
      for (const localItem of allLocalItems) {
        if (matchedLocalItems.has(localItem.id)) continue; // 已映射
        if (embyItem.type !== localItem.type) continue;
        // 标题完全相同
        if (
          embyItem.title === localItem.title ||
          (embyItem.originalTitle && localItem.originalTitle && embyItem.originalTitle === localItem.originalTitle)
        ) {
          exactMatch(embyItem, localItem);
          continue out;
        }
        // 外部ID匹配
        if (embyItem.externalIds && localItem.externalIds) {
          const embyIds = embyItem.externalIds as Record<string, string>;
          const localIds = localItem.externalIds as Record<string, string>;
          for (const key of Object.keys(embyIds)) {
            if (localIds[key] && embyIds[key] === localIds[key]) {
              exactMatch(embyItem, localItem);
              continue out;
            }
          }
        }
      }

      // 模糊匹配
      const matches: LocalItemWithScore[] = [];
      for (const localItem of allLocalItems) {
        if (matchedLocalItems.has(localItem.id)) continue; // 已映射
        let score = 0;
        // 标题相似度
        const titleSimilarity = compareStrings(embyItem.title, localItem.title);
        // 原始标题相似度
        const originalTitleSimilarity =
          embyItem.originalTitle && localItem.originalTitle
            ? compareStrings(embyItem.originalTitle, localItem.originalTitle)
            : 0;
        // 取较高的相似度作为基础分数
        score = Math.max(titleSimilarity, originalTitleSimilarity);
        // todo 其它匹配逻辑
        // 只保留分数大于阈值的匹配
        if (score >= 0.6) {
          matches.push({ ...localItem, score });
        }
      }
      // 按分数降序排序
      matches.sort((a, b) => b.score - a.score).slice(0, 5);
      res.push({ item: embyItem, matches, status: matches.length > 0 ? "multiple" : "none" });
    }
    return res;
  }

  /**
   * 批量处理映射操作
   */
  async batchProcessMappings(ops: ItemMapOperation[]) {
    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[],
    };

    for (const op of ops) {
      try {
        switch (op.type) {
          case "map":
            if (!op.localItemId) {
              throw new Error("映射操作需要本地项目ID");
            }
            await this.mapItem(op.localItemId, op.embyItemId);
            results.success.push(op.embyItemId);
            break;
          case "create":
            // 创建本地项目并映射
            const localItem = await this.createLocalItemFromEmby(op.embyItemId);
            results.success.push(localItem.id);
            break;
          case "unmap":
            await this.unmapItem(op.embyItemId);
            results.success.push(op.embyItemId);
            break;
          case "refresh":
            await this.updateLocalItem(op.embyItemId);
            break;
          default:
            // @ts-expect-error switch case exhaustive check
            throw new Error(`不支持的操作类型: ${op.type}`);
        }
      } catch (error) {
        results.failed.push({ id: op.embyItemId, error: error instanceof Error ? error.message : "未知错误" });
      }
    }

    return results;
  }

  /**
   * 从 EmbyItem 中获取可用于 LocalItem 的数据
   * @param item EmbyItem
   * @returns LocalItem 数据
   */
  private getLocalData(item: EmbyItem) {
    return {
      title: item.title,
      originalTitle: item.originalTitle || item.title,
      overview: item.overview,
      type: item.type,
      premiereDate: item.premiereDate,
      externalIds: item.externalIds ?? undefined,
    };
  }

  /**
   * 从 EmbyItem 创建 LocalItem 并建立映射关系. 会自动添加 Genre 中已存在的 tag.
   */
  async createLocalItemFromEmby(id: number) {
    const item = await dbClient.embyItem.findUnique({
      where: { id },
    });
    if (!item) throw new Error("Emby项目不存在");
    if (item.localItemId) throw new Error("该项目已映射到本地项目");

    return await dbClient.$transaction(async (tx) => {
      // 创建本地项目
      const localItem = await tx.localItem.create({ data: this.getLocalData(item) });
      // 添加标签
      await this.autoTag(tx, localItem, item);
      // 创建关联
      await tx.embyItem.update({ where: { id: item.id }, data: { localItem: { connect: { id: localItem.id } } } });
      return localItem;
    });
  }

  /**
   * 使用 EmbyItem 的数据更新 LocalItem
   * @param id LocalItem ID
   * @param embyItem EmbyItem
   */
  async updateLocalItem(embyItemId: number) {
    const embyItem = await dbClient.embyItem.findUnique({ where: { id: embyItemId } });
    if (!embyItem) throw new Error("Emby项目不存在");
    const id = embyItem.localItemId;
    if (!id) throw new Error("该项目未映射到本地项目");
    return await dbClient.localItem.update({ where: { id }, data: this.getLocalData(embyItem) });
  }
  /**
   * 手动映射本地项目和Emby项目
   */
  async mapItem(localItemId: number, embyItemId: number) {
    // 检查本地项目和Emby项目是否存在
    const localItem = await dbClient.localItem.findUnique({
      where: { id: localItemId },
      include: { tags: true },
    });

    const embyItem = await dbClient.embyItem.findUnique({
      where: { id: embyItemId },
      include: { localItem: true },
    });

    if (!localItem || !embyItem) throw new Error("本地或 Emby 数据不存在");
    // 检查是否已经映射
    if (embyItem?.localItem?.id === localItemId) return;

    return await dbClient.$transaction(async (tx) => {
      // 建立映射
      const updatedEmbyItem = await tx.embyItem.update({
        where: { id: embyItemId },
        data: { localItem: { connect: { id: localItemId } } },
      });
      // 添加标签
      await this.autoTag(tx, localItem, embyItem);
      return updatedEmbyItem;
    });
  }

  async unmapItem(embyItemId: number) {
    await dbClient.embyItem.update({ where: { id: embyItemId }, data: { localItem: { disconnect: true } } });
  }

  /**
   * 获取未映射的本地项目
   */
  async getUnmappedLocalItems(serverId: number, searchTerm?: string) {
    const whereCondition: Prisma.LocalItemWhereInput = {
      embyItems: { none: { embyServerId: serverId } },
    };

    // 如果有搜索词，添加搜索条件
    if (searchTerm) {
      whereCondition.OR = [{ title: { contains: searchTerm } }, { originalTitle: { contains: searchTerm } }];
    }

    return await dbClient.localItem.findMany({
      where: whereCondition,
      orderBy: { title: "asc" },
      take: 50, // 限制结果数量
    });
  }

  async filterLocalItems(query: ItemSearchOptions, serverId: number) {
    const whereConditions: Prisma.LocalItemWhereInput = { type: "Movie" };

    // 搜索关键词
    if (query.search?.trim()) {
      whereConditions.title = { contains: query.search };
    }

    // 年份范围过滤
    whereConditions.premiereDate = {};
    if (query.yearFrom) {
      whereConditions.premiereDate.gte = query.yearFrom ? new Date(query.yearFrom, 0, 1) : undefined;
    }
    if (query.yearTo) {
      whereConditions.premiereDate.lte = query.yearTo ? new Date(query.yearTo, 11, 31) : undefined;
    }

    // 标签列表过滤
    if (query.tagIds && query.tagIds.length > 0) {
      whereConditions.AND = query.tagIds.map((tagId) => ({ tags: { some: { id: tagId } } }));
    }

    // embyCreatedAt 排序在前端进行
    const sortBy = query.sortBy === "embyCreatedAt" ? "title" : query.sortBy ?? "title";
    const sortOrder = query.sortOrder ?? "asc";
    let sortInput: Prisma.LocalItemOrderByWithRelationInput;
    if (sortBy === "rating") {
      sortInput = { rating: { score: sortOrder } };
    } else {
      sortInput = { [sortBy]: sortOrder };
    }

    const args = {
      where: whereConditions,
      orderBy: sortInput,
      include: { tags: true, rating: true, embyItems: { where: { embyServerId: serverId } } },
    };
    const movies = await dbClient.localItem.findMany(args);
    return movies;
  }

  /**
   * 获取所有本地项目
   */
  async getAllLocalItems() {
    return dbClient.localItem.findMany({
      orderBy: { title: "asc" },
      include: { tags: true, rating: true, _count: { select: { embyItems: true } } },
    });
  }

  /**
   * 批量删除本地项目
   */
  async batchDeleteLocalItems(itemIds: number[]) {
    return dbClient.localItem.deleteMany({
      where: { id: { in: itemIds } },
    });
  }

  /**
   * 批量为项目添加标签
   */
  async batchAddTagsToItems(itemIds: Iterable<number>, tagIds: number[]) {
    // 由于 prisma 的限制, 无法在单个操作中完成. 如果发现性能问题, 可以考虑使用原生 SQL
    const operations = [];
    const tagConnections = tagIds.map((tagId) => ({ id: tagId }));
    for (const itemId of itemIds) {
      operations.push(
        dbClient.localItem.update({ where: { id: itemId }, data: { tags: { connect: tagConnections } } })
      );
    }
    await dbClient.$transaction(operations);
  }

  /**
   * 批量从项目移除标签
   */
  async batchRemoveTagsFromItems(itemIds: Iterable<number>, tagIds: number[]) {
    const operations = [];
    const tagDisconnections = tagIds.map((tagId) => ({ id: tagId }));
    for (const itemId of itemIds) {
      operations.push(
        dbClient.localItem.update({ where: { id: itemId }, data: { tags: { disconnect: tagDisconnections } } })
      );
    }
    await dbClient.$transaction(operations);
  }

  /**
   * 根据 EmbyItem 数据自动为 LocalItem 添加某些标签.
   *
   * - 若存在与 Emby Genres 同名的标签则添加. 不会创建新标签.
   * - 添加演员/导演/厂商标签, 不存在则新建.
   */
  private async autoTag(tx: Prisma.TransactionClient, localItem: LocalItem & { tags?: Tag[] }, embyItem: EmbyItem) {
    const genres = dbStringToArray(embyItem.genres);
    const actors = dbStringToArray(embyItem.actors);
    const directors = dbStringToArray(embyItem.directors);
    const studios = dbStringToArray(embyItem.studios);
    await Promise.all([
      Promise.all(
        // 添加与 Emby Genres 同名的标签
        genres.map(async (g) => {
          const tag = await tx.tag.findFirst({ where: { name: g } });
          if (!tag) return;
          if (!localItem.tags?.some((t) => t.id === tag.id)) {
            await tx.localItem.update({ where: { id: localItem.id }, data: { tags: { connect: { id: tag.id } } } });
          }
        })
      ),
      Promise.all(actors.map(async (actor) => this.addTagToItem(tx, localItem.id, `演员: ${actor}`))),
      Promise.all(directors.map(async (director) => this.addTagToItem(tx, localItem.id, `导演: ${director}`))),
      Promise.all(studios.map(async (studio) => await this.addTagToItem(tx, localItem.id, `片商: ${studio}`))),
    ]);
  }

  private async addTagToItem(tx: Prisma.TransactionClient, localItemId: number, tagName: string) {
    // 查找或创建标签
    let tag = await tx.tag.findFirst({ where: { name: tagName } });
    if (!tag) {
      tag = await tx.tag.create({ data: { name: tagName } });
    }
    // 创建项目标签关联
    await tx.localItem.update({ where: { id: localItemId }, data: { tags: { connect: { id: tag.id } } } });
    return tag;
  }
}

export const itemService = new ItemService();
