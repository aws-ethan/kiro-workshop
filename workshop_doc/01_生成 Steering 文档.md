---
title: "生成 Steering 文档"
weight: 21
---

## 生成 Steering 文档

让我们为 Workshop 项目创建 Steering 文档：

### 步骤 1：打开 Steering 面板

1. 查看 Kiro 左侧边栏
2. 找到并点击 Kiro features 面板（就是那个可爱的小幽灵图标）
3. 找到 "Generate Steering Docs" 按钮

> 💡 其他方式：你也可以通过 `Cmd + Shift + P`（Mac）或 `Ctrl + Shift + P`（Windows/Linux）打开命令面板，然后输入 `Kiro: Generate Steering` 并按回车。

### 步骤 2：生成文档

1. 点击 "Generate Steering Docs"
2. Kiro 将开始分析你的代码库

### 步骤 3：等待分析完成

Kiro 会在一个新的聊天会话中分析你的代码库。通常需要 30-60 秒。你会看到进度指示器显示：
- 正在分析代码文件
- 正在检测模式
- 正在生成文档

> ℹ️ Kiro 正在扫描你的整个代码库，包括：
> - 源代码文件（`.ts`、`.tsx`、`.js`、`.jsx`）
> - 配置文件（`package.json`、`tsconfig.json` 等）
> - 项目结构和组织方式
> - 现有的文档和注释

### 步骤 4：验证生成结果

完成后，Kiro 会在聊天会话中显示确认消息。

查看这些文档最简单的方式是通过 Kiro features 面板中的 Agent Steering 部分。

> 💡 你也可以在文件浏览器中查看 `.kiro/steering/` 目录。你应该能看到三个新文件：
> - `product.md`
> - `tech.md`
> - `structure.md`

## 查看生成的内容

从 Agent Steering 面板打开 Steering 文档，查看生成的三个文件。

### 每个文件中需要关注的内容

`product.md` 中：
- [ ] 应用名称和描述
- [ ] 核心功能列表
- [ ] 用户画像或目标受众
- [ ] 架构概览

`tech.md` 中：
- [ ] 前端框架和库（React、TypeScript、Vite）
- [ ] 后端运行时和服务（Node.js、Lambda、DynamoDB）
- [ ] 构建命令和脚本
- [ ] 测试框架

`structure.md` 中：
- [ ] 目录组织结构
- [ ] 关键文件位置
- [ ] 模块职责
- [ ] 重要的模式或约定

> ✅ Steering 文档应该随着代码库一起演进。当你添加新技术、重构架构或建立新模式时，记得更新它们。

## 测试 Steering 上下文 - 前后对比

让我们看看 Steering 文档带来的差异。

### 没有 Steering 上下文时（假设场景）

如果你在没有 Steering 的情况下问 Kiro：

💬 提示词："添加一个新的用户资料 API 端点"

Kiro 需要：
- 分析多个文件来理解你的框架和架构
- 搜索代码库来发现模式和约定
- 消耗大量上下文窗口空间来读取配置文件
- 在收集信息的过程中花费更长的响应时间

### 有 Steering 上下文时（现在）

现在测试 Kiro 是否理解你的项目上下文：

1. 打开一个新的 Kiro 聊天会话
2. 选择 Vibe 模式
3. 尝试以下提示词：

> 💬 测试提示词
> ```
> 这个应用的主要用途是什么，使用了哪些技术？
> ```

你应该看到：
- 在聊天顶部，Kiro 显示 "Including Steering Documents"，列出了 `product.md`、`structure.md` 和 `tech.md`
- Kiro 会回复具体的信息（通过引用 Steering 文件，而不是分析代码）：
  - 应用名称和用途（微博客平台）
  - 前端技术栈（React 18、TypeScript、Vite）
  - 后端技术栈（Node.js 18、Lambda、DynamoDB）
  - 架构（AWS 上的无服务器架构）

> ✅ 注意 Kiro 如何在不分析代码库的情况下提供具体、准确的信息。它直接读取之前生成的 Steering 文档（`product.md` 和 `tech.md`）。这比扫描代码文件要快得多、高效得多。

### 尝试一个更具体的问题

现在试试更技术性的问题：

> 💬 进阶测试提示词
> ```
> 如果要添加一个新的评论功能 API，应该在哪里添加路由和数据库表？
> ```

Kiro 应该引用 `structure.md` 来告诉你：
- 在 `backend/src/routes/` 中创建新的路由文件
- 遵循现有路由（如 `posts.js` 或 `users.js`）的模式
- 在 `backend/src/database.js` 中添加新的数据库表定义
- 使用 `withAuth` 中间件保护路由

## Tips

- Steering 文档让你不必在每次对话中重复技术栈和架构信息，Kiro 会自动加载这些持久化知识。
- 那些你反复向新团队成员解答的问题，就适合放在 Steering 文档中。
- 与传统 Wiki 或 README 不同，Steering 文档会自动加载到 AI 上下文中，更容易随代码库保持同步。

## 下一步

有了 Steering 文档，Kiro 现在对你的项目有了持久化的认知。在下一节中，你将使用 Vibe Coding 快速添加功能——你会看到 Steering 如何消除在每个提示词中解释技术栈的需要。

> ℹ️ 在高级 Steering 部分，你将学习如何创建仅在相关时才加载的领域特定 Steering 文件——非常适合设计系统、API 标准和安全策略。
