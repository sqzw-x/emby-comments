#!/usr/bin/env node

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");
const { loadEnvConfig } = require("@next/env");
const { log } = require("console");

console.log("Starting Emby Comments Server...");

// 1. 加载环境变量, server.js 需要使用
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from .env file...");
  loadEnvConfig(__dirname);
} else {
  console.log("No .env file found, using system environment variables");
}

// 2. 执行 Prisma 迁移
console.log("Running database migrations...");
try {
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("Database migrations completed successfully");
} catch (error) {
  console.error("Failed to run database migrations:", error.message);
  process.exit(1);
}

// 3. 启动服务器
console.log("Starting server...");
try {
  execSync(`${process.argv[0]} server.js`, {
    stdio: "inherit",
    cwd: __dirname,
  });
} catch (error) {
  console.error("Failed to start server:", error.message);
  process.exit(1);
}
