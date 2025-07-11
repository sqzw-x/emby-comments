---
applyTo: "**/actions/**/*.ts"
---

- 本项目内部的前后端交互一般使用 server actions, 不要创建 API 端点
- 本项目采用 server action - service - database 三层架构,
  - server action 直接由前端调用, 负责参数验证, 实际调用, 异常处理
  - service 负责实现业务逻辑, 组织为 XXService class, 创建全局实例供 server action 调用
  - database 由 prisma client 提供对数据库的访问, 使用全局单例
- server actions 需使用 utils.ts 中的 action 函数进行包装, 它负责统一处理异常和返回值, 前端不应进行异常处理
