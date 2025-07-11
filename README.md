# Emby Comments

> ⚠️ **AI生成说明与免责声明**
>
> 本项目出于学习及自用目的开发, 大量代码由AI生成, 不保证功能稳定性和维护及时性, 请慎重使用.

基于 Next.js 的 Emby 媒体评论和评分系统。

[![Docker Build](https://github.com/sqzw-x/emby-comments/actions/workflows/docker.yml/badge.svg)](https://github.com/sqzw-x/emby-comments/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 功能特性

- 🎬 连接 Emby 服务器，同步媒体库信息
- ⭐ 对电影、电视剧等媒体内容进行评分和评论
- 🏷️ 自定义标签管理
- 🐳 Docker 容器化部署
- 🔄 自动数据库迁移

## 快速开始

### 🚀 Docker 部署

推荐使用 Docker Compose 部署

#### 1. 下载配置文件并修改

```bash
# 创建项目目录
mkdir emby-comments && cd emby-comments

# 下载 docker-compose.yml
wget https://raw.githubusercontent.com/sqzw-x/emby-comments/refs/heads/main/docker/docker-compose.yml
```

#### 2. 启动服务

```bash
docker-compose up -d
```

## 💻 开发环境

1. **安装依赖**

```bash
pnpm install
```

2. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

3. **初始化数据库**

```bash
pnpm prisma:init
```

4. **启动开发服务器**

```bash
pnpm dev
```
