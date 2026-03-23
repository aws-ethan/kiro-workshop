# 实施计划：本地开发环境搭建

## 概述

将 Kiro Workshop 微博客应用从 AWS 云端架构改造为完全本地运行。按照"基础设施 → 数据层 → 认证层 → 业务路由 → 前端适配 → 启动脚本"的顺序逐步实施，每一步都在前一步基础上构建，确保增量可验证。

## 任务

- [x] 1. 搭建后端项目基础结构与依赖
  - [x] 1.1 更新 `backend/package.json`，添加本地开发依赖
    - 添加 express、cors、dotenv、better-sqlite3、jsonwebtoken、bcryptjs、uuid、nodemon 依赖
    - 添加 jest、fast-check、supertest 到 devDependencies
    - 添加 scripts：`dev`（nodemon）、`db:reset`、`test`
    - _需求：1.1, 6.1, 6.4, 7.2_

  - [x] 1.2 创建 `backend/.env.example` 和 `backend/.env` 环境变量文件
    - 包含 PORT=3001、JWT_SECRET、DB_PATH=./data/local.db
    - _需求：6.4, 6.5, 3.7_

  - [x] 1.3 更新 `backend/.gitignore`，添加 `data/` 目录和 `.env` 文件
    - _需求：7.1, 7.3_

- [x] 2. 实现数据库模块
  - [x] 2.1 创建 `backend/src/database.js`
    - 实现 `getDb()` 函数，使用 better-sqlite3 连接 SQLite
    - 实现 `initDatabase()` 函数，创建 users、posts、likes、follows 四张表及索引（IF NOT EXISTS）
    - 实现 `closeDb()` 函数用于测试清理
    - 设置 WAL 模式和外键约束
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 编写属性测试：数据库初始化幂等性
    - **属性 2：数据库初始化幂等性**
    - 对任意次数（1-10）的 initDatabase() 调用，数据库中应始终存在四张表且不产生错误
    - **验证需求：2.7**

  - [x] 2.3 编写单元测试：数据库表结构验证
    - 验证 initDatabase() 后四张表存在
    - 验证 users 表 username 唯一索引
    - 验证 likes 表 (userId, postId) 唯一约束
    - 验证 follows 表 (followerId, followeeId) 唯一约束
    - _需求：2.2, 2.3, 2.5, 2.6_

- [x] 3. 实现认证模块
  - [x] 3.1 创建 `backend/src/middleware/auth.js`
    - 实现 `withAuth` Express 中间件函数
    - 从 Authorization header 提取 Bearer token
    - 使用 jsonwebtoken 验证签名和过期时间
    - 将 { id, username } 附加到 req.user
    - JWT 缺失/无效/过期时返回 401
    - _需求：3.5, 3.6, 3.7_

  - [x] 3.2 编写属性测试：JWT 令牌往返完整性
    - **属性 5：JWT 令牌往返完整性**
    - 对任意用户 id/username，签发的 JWT 经验证后解码出的信息应一致，过期时间约 24 小时
    - **验证需求：3.4, 3.5**

- [x] 4. 实现认证路由
  - [x] 4.1 创建 `backend/src/routes/auth.js`
    - 实现 POST /auth/register：验证输入、bcrypt 哈希密码、生成 UUID、存入 SQLite、返回用户信息（201）
    - 实现 POST /auth/login：查找用户、bcrypt 验证密码、签发 JWT（含 id 和 username，24h 有效期）、返回 token + 用户信息
    - 处理用户名重复（409）、凭据错误（401）等错误
    - _需求：3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 编写属性测试：注册-登录往返一致性
    - **属性 3：注册-登录往返一致性**
    - 对任意有效的用户名/邮箱/密码，先注册再登录应成功返回包含正确 id 和 username 的 JWT
    - **验证需求：3.1, 3.3**

  - [x] 4.3 编写属性测试：用户名唯一性约束
    - **属性 4：用户名唯一性约束**
    - 对任意已注册的用户名，重复注册应返回 409，数据库中记录数仍为 1
    - **验证需求：2.3, 3.2**

- [x] 5. 检查点 - 确保基础模块正常
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 6. 实现帖子路由
  - [x] 6.1 创建 `backend/src/routes/posts.js`
    - 实现 POST /posts：验证内容非空且 ≤280 字符、生成 UUID、记录时间戳、存入 SQLite
    - 实现 GET /posts：支持 limit、sortBy（newest/popular）、userId、nextToken 分页参数
    - 实现 GET /users/:userId/posts：复用 getPosts 逻辑按 userId 过滤
    - 实现 POST /posts/:postId/like：检查帖子存在、检查重复点赞、创建点赞记录、更新 likesCount
    - 所有路由使用 withAuth 中间件保护
    - _需求：4.1, 4.2, 4.3_

  - [x] 6.2 编写属性测试：帖子内容验证边界
    - **属性 6：帖子内容验证边界**
    - 对任意字符串，trim 后非空且 ≤280 字符则创建成功，否则被拒绝且帖子总数不变
    - **验证需求：4.1**

  - [x] 6.3 编写属性测试：帖子列表排序正确性
    - **属性 7：帖子列表排序正确性**
    - 对任意帖子集合，newest 按 createdAt 降序，popular 按 likesCount 降序，返回数量不超过 limit
    - **验证需求：4.2**

  - [x] 6.4 编写属性测试：点赞操作正确性
    - **属性 8：点赞操作正确性**
    - 首次点赞使 likesCount +1，重复点赞返回错误且 likesCount 不变
    - **验证需求：2.5, 4.3**

- [x] 7. 实现用户路由
  - [x] 7.1 创建 `backend/src/routes/users.js`
    - 实现 GET /users/:userId：返回用户信息（排除 passwordHash），不存在返回 404
    - 实现 PUT /users/:userId：仅允许更新自己的 displayName/bio/avatarUrl，他人返回 403
    - 实现 POST /users/:userId/follow：防止自我关注、防止重复关注、创建记录、更新双方计数器
    - 实现 POST /users/:userId/unfollow：检查关注关系存在、删除记录、更新双方计数器
    - 实现 GET /users/:userId/following：返回当前用户是否关注了指定用户
    - 所有路由使用 withAuth 中间件保护
    - _需求：4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 7.2 编写属性测试：用户资料响应数据安全性
    - **属性 9：用户资料响应数据安全性**
    - 对任意用户资料查询，返回的 JSON 不应包含 passwordHash 字段
    - **验证需求：4.4**

  - [x] 7.3 编写属性测试：用户资料更新授权与字段限制
    - **属性 10：用户资料更新授权与字段限制**
    - 用户 A 更新用户 B 的资料应返回 403；更新自己时仅 displayName/bio/avatarUrl 被更新，其他字段不变
    - **验证需求：4.5**

  - [x] 7.4 编写属性测试：关注-取消关注往返一致性
    - **属性 11：关注-取消关注往返一致性**
    - A 关注 B 后取消关注，双方计数器恢复原值；自我关注被拒绝
    - **验证需求：2.6, 4.6, 4.7**

  - [x] 7.5 编写属性测试：关注状态查询一致性
    - **属性 12：关注状态查询一致性**
    - checkFollowing 返回 true 当且仅当 follows 表中存在对应记录
    - **验证需求：4.8**

- [-] 8. 检查点 - 确保所有业务路由正常
  - 确保所有测试通过，如有问题请向用户确认。

- [ ] 9. 创建 Express 服务器入口并组装路由
  - [~] 9.1 创建 `backend/src/server.js`
    - 加载 dotenv 配置
    - 初始化 Express 应用，注册 cors、express.json 中间件
    - 调用 initDatabase() 初始化数据库
    - 挂载 /auth、/users、/posts 路由
    - 监听 PORT（默认 3001），输出启动信息
    - JWT_SECRET 未设置时输出警告并使用默认开发密钥
    - 启动失败时输出错误并 process.exit(1)
    - _需求：1.1, 1.2, 1.3, 1.4, 1.5, 6.3, 6.5_

  - [~] 9.2 编写属性测试：CORS 头存在性
    - **属性 1：CORS 头存在性**
    - 对任意 HTTP 方法和有效路由，响应应包含 Access-Control-Allow-Origin 头
    - **验证需求：1.3**

- [ ] 10. 前端环境变量适配
  - [~] 10.1 创建 `frontend/.env.local` 示例文件
    - 设置 VITE_API_URL=http://localhost:3001
    - 移除 Cognito 相关变量（VITE_USER_POOL_ID 等）
    - _需求：5.1, 5.3_

  - [~] 10.2 更新 `frontend/.env.example`（如存在）
    - 添加本地开发配置说明
    - _需求：5.3_

- [ ] 11. 实现数据库重置脚本
  - [~] 11.1 创建 `backend/scripts/reset-db.js`
    - 删除 data/local.db 文件（如存在）
    - 调用 initDatabase() 重新创建表结构
    - 输出重置完成信息
    - _需求：7.2_

- [~] 12. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选测试任务，可跳过以加速 MVP 开发
- 每个任务引用了对应的需求编号，确保可追溯性
- 检查点任务用于增量验证，确保每个阶段的代码正确性
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- 原有 Lambda 函数代码保留不修改，新增的 Express 路由是独立的实现
