# 需求文档

## 简介

将 Kiro Workshop 微博客（Micro Blogging）全栈应用从 AWS 云端部署改造为完全本地运行。当前后端依赖 AWS Lambda、DynamoDB、Cognito 和 API Gateway，前端通过 Vite 开发服务器运行。改造目标是用本地替代方案替换所有 AWS 服务依赖，使开发者无需 AWS 账号即可在本地启动和运行完整应用。

## 术语表

- **Local_Server**: 基于 Express.js 的本地 HTTP 服务器，替代 AWS API Gateway + Lambda 的组合
- **Local_Database**: 基于 SQLite（通过 better-sqlite3）的本地数据库，替代 AWS DynamoDB
- **Local_Auth**: 基于 JWT（jsonwebtoken + bcrypt）的本地认证模块，替代 AWS Cognito
- **Frontend_App**: 基于 React + Vite + TypeScript 的前端单页应用
- **API_Service**: 前端中的 api.ts 服务层，负责向后端发送 HTTP 请求
- **Auth_Middleware**: 后端认证中间件，负责验证请求中的 JWT 令牌并提取用户信息

## 需求

### 需求 1：本地 HTTP 服务器

**用户故事：** 作为开发者，我希望用本地 Express 服务器替代 AWS Lambda + API Gateway，以便无需 AWS 账号即可运行后端服务。

#### 验收标准

1. THE Local_Server SHALL 在可配置端口（默认 3001）上监听 HTTP 请求
2. THE Local_Server SHALL 提供与当前 API Gateway 相同的 REST 路由结构：
   - POST /auth/register
   - POST /auth/login
   - GET /users/:userId
   - PUT /users/:userId
   - POST /users/:userId/follow
   - POST /users/:userId/unfollow
   - GET /users/:userId/following
   - GET /posts
   - POST /posts
   - GET /users/:userId/posts
   - POST /posts/:postId/like
3. THE Local_Server SHALL 对所有响应设置 CORS 头，允许来自前端开发服务器的跨域请求
4. WHEN Local_Server 启动时，THE Local_Server SHALL 自动初始化数据库表结构
5. IF Local_Server 启动失败，THEN THE Local_Server SHALL 在控制台输出具体错误信息并以非零退出码退出

### 需求 2：本地数据库替代

**用户故事：** 作为开发者，我希望用本地 SQLite 数据库替代 AWS DynamoDB，以便数据持久化在本地文件中，无需云端数据库服务。

#### 验收标准

1. THE Local_Database SHALL 使用 SQLite 存储所有应用数据，数据库文件保存在项目目录中
2. THE Local_Database SHALL 包含以下数据表，对应当前 DynamoDB 表的数据结构：
   - users 表（id, username, email, displayName, bio, avatarUrl, passwordHash, createdAt, updatedAt, followersCount, followingCount）
   - posts 表（id, userId, content, createdAt, updatedAt, likesCount, commentsCount）
   - likes 表（userId, postId, createdAt）
   - follows 表（followerId, followeeId, createdAt）
3. THE Local_Database SHALL 为 users 表的 username 字段创建唯一索引
4. THE Local_Database SHALL 为 posts 表的 userId 字段创建索引以支持按用户查询帖子
5. THE Local_Database SHALL 为 likes 表的 (userId, postId) 组合创建唯一约束以防止重复点赞
6. THE Local_Database SHALL 为 follows 表的 (followerId, followeeId) 组合创建唯一约束以防止重复关注
7. WHEN 应用首次启动时，THE Local_Database SHALL 自动创建所有表和索引（如尚不存在）

### 需求 3：本地认证系统

**用户故事：** 作为开发者，我希望用本地 JWT 认证替代 AWS Cognito，以便用户注册和登录功能完全在本地运行。

#### 验收标准

1. WHEN 用户提交注册请求时，THE Local_Auth SHALL 使用 bcrypt 对密码进行哈希处理后存储到 Local_Database
2. WHEN 用户提交注册请求时，THE Local_Auth SHALL 验证 username 的唯一性，并在重复时返回 HTTP 409 状态码
3. WHEN 用户提交登录请求时，THE Local_Auth SHALL 使用 bcrypt 验证密码，验证通过后签发 JWT 令牌
4. THE Local_Auth SHALL 签发包含用户 id 和 username 的 JWT 令牌，有效期为 24 小时
5. THE Auth_Middleware SHALL 从请求的 Authorization 头中提取 Bearer 令牌，验证 JWT 签名，并将解码后的用户信息附加到请求对象上
6. IF JWT 令牌缺失、过期或签名无效，THEN THE Auth_Middleware SHALL 返回 HTTP 401 状态码和错误描述
7. THE Local_Auth SHALL 使用可通过环境变量 JWT_SECRET 配置的密钥签发和验证令牌

### 需求 4：后端业务逻辑迁移

**用户故事：** 作为开发者，我希望将所有 Lambda 函数中的业务逻辑迁移为 Express 路由处理函数，以便保持完整的应用功能。

#### 验收标准

1. THE Local_Server SHALL 实现帖子创建功能：验证内容非空且不超过 280 字符，生成 UUID 作为帖子 ID，记录创建时间
2. THE Local_Server SHALL 实现帖子列表查询功能：支持 limit、sortBy（newest/popular）、userId 和分页参数
3. THE Local_Server SHALL 实现帖子点赞功能：检查帖子是否存在、是否已点赞，创建点赞记录并更新帖子的 likesCount
4. THE Local_Server SHALL 实现用户资料查询功能：根据 userId 返回用户信息（排除 passwordHash）
5. THE Local_Server SHALL 实现用户资料更新功能：仅允许用户更新自己的 displayName、bio 和 avatarUrl 字段
6. THE Local_Server SHALL 实现关注功能：防止自我关注、防止重复关注，创建关注记录并更新双方的 followersCount 和 followingCount
7. THE Local_Server SHALL 实现取消关注功能：删除关注记录并更新双方的计数器
8. THE Local_Server SHALL 实现关注状态查询功能：返回当前用户是否关注了指定用户

### 需求 5：前端 API 层适配

**用户故事：** 作为开发者，我希望前端 API 调用能无缝切换到本地后端服务，以便前端无需修改业务逻辑即可连接本地服务器。

#### 验收标准

1. THE Frontend_App SHALL 通过环境变量 VITE_API_URL 配置后端 API 地址，本地开发时指向 http://localhost:3001
2. THE API_Service SHALL 保持现有的请求路径和参数格式不变，确保与本地后端的接口兼容
3. THE Frontend_App SHALL 提供 .env.local 示例文件，包含本地开发所需的环境变量配置
4. WHEN 前端发送认证请求时，THE API_Service SHALL 继续使用 Bearer 令牌格式传递 JWT

### 需求 6：开发启动流程

**用户故事：** 作为开发者，我希望通过简单的命令即可启动完整的本地开发环境，以便快速开始开发工作。

#### 验收标准

1. THE Local_Server SHALL 支持通过 `npm run dev` 命令启动后端服务（使用 nodemon 实现热重载）
2. THE Frontend_App SHALL 继续支持通过 `npm run dev` 命令启动前端开发服务器
3. THE Local_Server SHALL 在启动时输出监听地址和端口信息
4. THE Local_Server SHALL 通过 .env 文件加载配置（端口号、JWT 密钥、数据库文件路径）
5. IF .env 文件中未设置 JWT_SECRET，THEN THE Local_Server SHALL 使用默认开发密钥并在控制台输出警告信息

### 需求 7：数据隔离与重置

**用户故事：** 作为开发者，我希望能方便地重置本地数据库，以便在开发和测试时获得干净的数据环境。

#### 验收标准

1. THE Local_Database SHALL 将数据库文件存储在 backend/data/ 目录下
2. THE Local_Server SHALL 支持通过 `npm run db:reset` 命令删除并重新创建数据库
3. THE Local_Database 的数据库文件 SHALL 被添加到 .gitignore 中，避免提交到版本控制
