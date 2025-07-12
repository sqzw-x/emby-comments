#!/usr/bin/env node

// 加载环境变量
import "dotenv/config";

import { error, log } from "console";
import { EmbyClient, EmbyConfig } from "../src/lib/sdk/emby";

const run = custom2;

async function custom3(client: EmbyClient) {
  const userId = await client.getAdminUserId();
  if (!userId) return;

  const item = await client.users.items.retrieve("5722", { UserId: userId });
  log("获取到的项目:", item);

  const item1 = await client.get(`/Users/${userId}/Items/5722`, {});
  log("通过 get 方法获取的项目:", item1);
}

async function custom2(client: EmbyClient) {
  const serverItems = await client.getItems({
    Recursive: true,
    IncludeItemTypes: "Movie,Series",
    Fields: "Overview,Genres,Studios,ProviderIds,DateCreated,People,Path,PremiereDate,ProductionYear",
    SortBy: "Name",
    SortOrder: "Ascending",
  });

  log("📦 获取到的服务器项目:", serverItems?.length, "个");
  if (!serverItems || serverItems.length === 0) {
    log("❌ 未获取到任何项目");
    return;
  }
  log("示例项目:", serverItems[50]);
}

async function custom1(client: EmbyClient) {
  log("=== 开始执行 ===\n");
  try {
    const serverItems = await client.getItems({
      Recursive: true,
      IncludeItemTypes: "Movie,Series",
      Fields: "Genres,Studios,DateCreated,Path,HomePageUrl",
      SortBy: "Name",
      SortOrder: "Ascending",
    });
    log("📦 获取到的服务器项目:", serverItems?.length, "个");

    if (!serverItems || serverItems.length === 0) {
      log("❌ 未获取到任何项目");
      return;
    }

    log("示例项目:", serverItems[0]);

    // 分析分段电影问题
    log("\n🎬 分析分段电影:");
    const movieItems = serverItems.filter((item) => item.Type === "Movie");
    log(`📊 总共 ${movieItems.length} 个电影项目`);

    // 按名称分组，检测分段电影
    const [filteredItems, multiPartMovies] = EmbyClient.filterMultiPartItems(movieItems);
    log(`✅ 过滤后剩余 ${filteredItems.length} 个电影项目`);
    if (multiPartMovies.length > 0) {
      log("🔍 检测到分段电影:");
      multiPartMovies.forEach((items) => {
        log(`- ${items[0].Name} (${items.length} 部分):`);
        items.forEach((item) => log(`  - ${item.Path || "无路径"}`));
      });
    } else {
      log("✅ 未检测到分段电影");
    }
  } catch (err) {
    error("Emby error:", err);
  }
  log("\n=== END ===");
}

const config: EmbyConfig = {
  name: "Test Server",
  url: process.env.DEBUG_EMBY_URL || "http://localhost:8096",
  apiKey: process.env.DEBUG_EMBY_API_KEY || "your-api-key-here",
  isActive: true,
};

// 支持命令行参数覆盖配置
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedConfig = { ...config };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case "--url":
        parsedConfig.url = value;
        break;
      case "--api-key":
        parsedConfig.apiKey = value;
        break;
      case "--name":
        parsedConfig.name = value;
        break;
      case "--help":
        log(`
使用方法: pnpm tsx debug-emby.ts [选项]

选项:
  --url <url>         Emby 服务器地址 (默认: ${config.url})
  --api-key <key>     API Key
  --help              显示帮助信息

环境变量:
  EMBY_URL           Emby 服务器地址
  EMBY_API_KEY       API Key
  EMBY_SERVER_NAME   服务器名称

示例:
  # 使用命令行参数
  pnpm tsx debug-emby.,s --url http://192.168.1.100:8096 --api-key your-real-api-key
  
  # 使用环境变量
  EMBY_URL=http://192.168.1.100:8096 EMBY_API_KEY=your-real-api-key pnpm tsx debug-emby.ts
        `);
        process.exit(0);
    }
  }

  return parsedConfig;
}

// 主函数
async function main() {
  log("🔧 EmbyClient 调试工具\n");

  const runtimeConfig = parseArgs();

  // 更新全局配置
  Object.assign(config, runtimeConfig);

  log("📋 当前配置:");
  log("- 服务器地址:", config.url);
  log("- API Key:", config.apiKey.substring(0, 8) + "...");
  log("");

  if (config.apiKey === "your-api-key-here") {
    log("⚠️  请先设置正确的 API Key!");
    log("可以通过以下方式设置:");
    log("1. 命令行参数: --api-key your-real-api-key");
    log("2. 环境变量: DEBUG_EMBY_API_KEY=your-real-api-key");
    log("3. 修改 .env 文件");
    log("使用 --help 查看详细使用方法\n");
    return;
  }

  await run(new EmbyClient(config));
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main().catch(console.error);
}
