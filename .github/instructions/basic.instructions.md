---
applyTo: "**/*.ts"
---

在编写代码时, 请遵循以下原则:

- 使用 TypeScript 作为编程语言, next.js 作为框架
- 使用 pnpm 作为包管理器, prisma 作为 ORM

- 若需要新增后端调用, 不要创建 API 端口, 而是使用 server actions
- 前端不要对 server actions 调用进行异常处理, 只需检测返回值是否成功即可
- 内部链接不要硬编码路径, 而是使用 src/lib/routes.ts
- 使用 MUI 组件, 遵循 material 设计规范
- 尽量避免使用 as 操作, 若一定需要请添加注释说明

- 在创建复杂的组件时, 合理拆分复用, 组件内也可使用 useMemo 和 useCallback 进行复用和性能优化
- 不要创建 demo, 只生成必要的代码
- 生成代码后进行 lint 和 build, 并修复错误, 不必修复你没有修改的部分的错误
