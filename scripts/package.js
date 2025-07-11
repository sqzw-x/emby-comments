#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * 删除目录及其内容
 * @param {string} dirPath - 要删除的目录路径
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * 设置文件执行权限
 * @param {string} filePath - 文件路径
 */
function makeExecutable(filePath) {
  if (fs.existsSync(filePath)) {
    fs.chmodSync(filePath, "755");
  }
}

/**
 * 主打包函数
 */
async function packageApp() {
  console.log("🏗️  Building Next.js application...");
  try {
    execSync("pnpm build", { stdio: "inherit" });
    console.log("✅ Build completed successfully");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }

  console.log("📦 Preparing distribution files...");

  // 清理并创建 build 目录
  const buildDir = path.join(process.cwd(), "build");
  removeDir(buildDir);
  fs.mkdirSync(buildDir, { recursive: true });
  console.log("🗑️ Cleaned build directory");

  // 复制 standalone 构建文件
  console.log("📋 Copying standalone build...");
  const standaloneDir = path.join(process.cwd(), ".next/standalone");
  if (fs.existsSync(standaloneDir)) {
    fs.cpSync(standaloneDir, buildDir, {
      recursive: true,
      verbatimSymlinks: true, // 保留相对路径的符号链接
      filter: (raw, target) => !raw.endsWith(".env"),
    });
    console.log("✅ Standalone files copied");
  } else {
    console.warn('⚠️ Standalone build not found. Make sure output: "standalone" is set in next.config.js');
  }

  // 复制静态文件
  console.log("🎨 Copying static files...");
  const staticDir = path.join(process.cwd(), ".next/static");
  const buildStaticDir = path.join(buildDir, ".next/static");
  if (fs.existsSync(staticDir)) {
    fs.cpSync(staticDir, buildStaticDir, { recursive: true });
    console.log("✅ Static file copied");
  }

  // 复制 public 文件
  console.log("🌐  Copying public files...");
  const publicDir = path.join(process.cwd(), "public");
  const buildPublicDir = path.join(buildDir, "public");
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, buildPublicDir, { recursive: true });
    console.log("✅ Public files copied");
  }

  // 复制 Prisma 文件（过滤掉数据库文件）
  console.log("🗄️ Copying Prisma files...");
  const prismaDir = path.join(process.cwd(), "prisma");
  const buildPrismaDir = path.join(buildDir, "prisma");
  if (fs.existsSync(prismaDir)) {
    fs.cpSync(prismaDir, buildPrismaDir, {
      recursive: true,
      filter: (raw, target) => !raw.endsWith(".db") && !raw.endsWith(".db-journal") && !raw.endsWith(".db-wal"), // 过滤掉数据库文件和 .env 文件
    });
    console.log("✅ Prisma files copied (excluding database files)");
  }

  // 复制 .env.example
  console.log("📄 Copying example .env file...");
  const envEgPath = path.join(process.cwd(), ".env.example");
  const buildEnvEgPath = path.join(buildDir, ".env.example");
  if (fs.existsSync(envEgPath)) {
    fs.copyFileSync(envEgPath, buildEnvEgPath);
    console.log("✅ Example .env file copied");
  }

  // 复制启动脚本
  console.log("🚀 Copying start scripts...");
  const scriptsToCopy = [{ src: "scripts/start.js", dest: "start.js" }];

  for (const script of scriptsToCopy) {
    const srcPath = path.join(process.cwd(), script.src);
    const destPath = path.join(buildDir, script.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      makeExecutable(destPath);
      console.log(`✅ Copied ${script.src} → ${script.dest}`);
    } else {
      console.warn(`⚠️ Script not found: ${script.src}`);
    }
  }

  // 手动添加 @next/env 包到构建中, start.js 需要它来加载环境变量
  console.log("📦 Adding @next/env package to build...");
  // buildDir/node_modules/.pnpm/@next+env@* 目录已存在, 创建 buildDir/node_modules/@next/env 软链接指向它即可
  const nodeModulesDir = path.join(buildDir, "node_modules");
  const pnpmDir = path.join(nodeModulesDir, ".pnpm");
  const nextScopeDir = path.join(nodeModulesDir, "@next");
  const nextEnvLinkPath = path.join(nextScopeDir, "env");

  try {
    if (!fs.existsSync(pnpmDir)) {
      console.warn("⚠️ .pnpm directory not found");
      return;
    }
    const nextEnvDir = fs.readdirSync(pnpmDir).find((file) => file.startsWith("@next+env@"));
    if (!nextEnvDir) throw new Error(`@next+env@* does not exist in ${pnpmDir}`);
    const pkgRealPath = path.join(pnpmDir, nextEnvDir, "node_modules/@next/env");
    if (!fs.existsSync(pkgRealPath)) throw new Error(`${pkgRealPath} does not exist`);
    fs.mkdirSync(nextScopeDir, { recursive: true });
    const relativePath = path.relative(nextScopeDir, pkgRealPath);
    fs.symlinkSync(relativePath, nextEnvLinkPath);
    console.log(`✅ Created symlink: @next/env → ${relativePath}`);
  } catch (error) {
    console.error("❌ Failed to create @next/env symlink:", error.message);
  }

  // 显示构建摘要
  console.log("\n🎉 Package preparation complete!");
  console.log(`📁 Build output: ${buildDir}`);

  // 显示目录大小
  try {
    const output = execSync(`du -sh "${buildDir}"`, { encoding: "utf8" });
    console.log(`📊 Build size: ${output.trim().split("\t")[0]}`);
  } catch (error) {
    // 如果 du 命令失败（比如在 Windows 上），忽略错误
  }

  console.log("\n📋 Next steps:");
  console.log("1. Test the build: cd build && npm install && npm start");
  console.log("2. Create package: tar -czf emby-comments.tar.gz -C build .");
  console.log("3. Deploy to server and extract");
}

// 运行打包脚本
if (require.main === module) {
  packageApp().catch((error) => {
    console.error("💥 Packaging failed:", error);
    process.exit(1);
  });
}

module.exports = { packageApp };
