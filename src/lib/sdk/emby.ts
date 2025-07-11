import Emby from "emby-sdk-stainless";
import { BaseItem, ItemListParams } from "emby-sdk-stainless/resources";

export interface EmbyConfig {
  name: string;
  url: string;
  apiKey: string;
  isActive: boolean;
}

export interface TestResp {
  success: boolean;
  serverName?: string;
  version?: string;
  serverId?: string;
  os?: string;
  error?: string;
}

export class EmbyClient extends Emby {
  userId?: string;
  constructor(config: EmbyConfig) {
    super({ apiKey: config.apiKey, baseURL: config.url, timeout: 10 * 1000, maxRetries: 2 });
  }

  async testConnection(): Promise<TestResp> {
    const resp = await this.system.info.retrieve();
    return {
      success: true,
      serverName: resp.ServerName,
      version: resp.Version,
      serverId: resp.Id,
      os: resp.OperatingSystem,
    };
  }

  async getItems(params: ItemListParams) {
    try {
      const resp = await this.items.list(params);
      return resp.Items;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  }

  /**
   * 获取 Emby 管理员用户 ID.
   * @returns
   */
  async getAdminUserId() {
    const users = await this.users.listAll();
    this.userId = users.Items?.filter((u) => u.Policy?.IsAdministrator).at(0)?.Id;
    return this.userId;
  }

  getImageUrl(itemId: string, imageTag: string, imageType = "Primary", width = 400) {
    return `${this.baseURL}/Items/${itemId}/Images/${imageType}?maxWidth=${width}&tag=${imageTag}`;
  }

  getBackdropUrl(itemId: string, imageTag: string, width = 1280) {
    return `${this.baseURL}/Items/${itemId}/Images/Backdrop?maxWidth=${width}&tag=${imageTag}`;
  }

  /**
   * 筛选分段电影. Emby API 会将分段电影作为多个项目返回, 此处根据源文件所在目录筛选, 仅保留一个项目.
   */
  static filterMultiPartItems(allItems: BaseItem[]) {
    // 按标题粗略分组
    const groupByName = Map.groupBy(allItems, (item) => item.Name ?? "_");

    // 获取最后一个路径分隔符前的内容, 考虑两种路径分隔符
    const getDir = (p: string) => p.split(/\/|\\/).slice(0, -1).join("/");

    // 按所在目录精确分组
    const multiPartMovies = groupByName
      .values()
      .filter((movies) => movies.length > 1)
      .map((movies) => Map.groupBy(movies, (item) => (item.Path ? getDir(item.Path) : "_")))
      .reduce((acc, group) => {
        group.forEach((items) => acc.push(items));
        return acc;
      }, new Array<BaseItem[]>());

    // 输出分段电影报告
    // let report = "";
    // report += `🔍 可能的分段电影: ${multiPartMovies.length} 组\n`;
    // multiPartMovies.forEach((items) => {
    //   report += `- ${items[0].Name} (${items.length} 部分):\n`;
    //   items.forEach((item) => (report += `  - ${item.Path || "无路径"}\n`));
    // });

    // 分段仅保留一部分
    const needRemove = multiPartMovies.map((items) => items.slice(1)).flat();
    const filteredItems = allItems.filter((item) => !needRemove.includes(item));
    return [filteredItems, multiPartMovies] as const;
  }
}
