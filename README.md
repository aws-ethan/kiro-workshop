# Kiro Workshop — Micro Blogging App

一个类似 Twitter 的微博客应用，用于学习和体验 [Kiro](https://kiro.dev/) 的核心功能。

## 项目简介

Micro Blogging 是一个全栈社交媒体应用，支持用户注册、登录、发布短帖（≤ 280 字符）、关注/取消关注、点赞和评论。项目采用 npm workspaces 的 monorepo 结构，前后端分离。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript, Vite 4, React Router v6, 纯 CSS |
| 后端 | Node.js + Express (CommonJS), SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| 测试 | Jest + Supertest, fast-check 属性测试, Playwright E2E |

## 快速开始

```bash
# 克隆项目
git clone https://github.com/aws-ethan/kiro-workshop/

# 安装依赖
npm install

# 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 启动后端
npm run start:backend

# 启动前端（新终端窗口）
npm run start:frontend
```

前端默认运行在 `http://localhost:5174`，后端运行在 `http://localhost:3001`。

使用默认账号登录：用户名 `admin`，密码 `admin123`。

## 项目结构

```
├── backend/
│   ├── src/
│   │   ├── server.js          # Express 应用入口
│   │   ├── database.js        # SQLite 连接与表结构
│   │   ├── middleware/auth.js  # JWT 认证中间件
│   │   └── routes/            # API 路由 (auth, posts, users)
│   ├── __tests__/             # 单元测试与属性测试
│   └── data/                  # SQLite 数据库文件
├── frontend/
│   ├── src/
│   │   ├── pages/             # 页面组件 (Feed, Profile, Login 等)
│   │   ├── components/        # 通用组件
│   │   ├── contexts/          # AuthContext 认证状态管理
│   │   ├── services/api.ts    # API 客户端
│   │   └── types/             # TypeScript 类型定义
│   └── playwright.config.ts
├── workshop_doc/              # Workshop 教程文档
└── DESIGN_LANGUAGE.md         # UI 设计规范
```

## 常用命令

```bash
npm run start:frontend    # 启动前端开发服务器
npm run start:backend     # 启动后端开发服务器
npm test                  # 运行后端测试
cd frontend && npm run lint          # 前端代码检查
cd frontend && npm run build         # 前端构建
cd backend && npm run db:reset       # 重置数据库
```

## Workshop 教程

本项目配套 Kiro Workshop，通过实践学习 Kiro 的核心能力：

1. **Steering 文档** — 为项目生成持久化上下文，让 AI 理解你的技术栈和架构
2. **Vibe 模式** — 对话式快速开发，适合单组件修改（如添加取消按钮）
3. **Spec 模式** — 结构化功能开发（需求 → 设计 → 任务），适合跨文件复杂功能（如评论系统）
4. **Agent Hooks** — 自动化工作流，如保存时 lint、任务完成后自动测试
5. **条件 Steering + Spec 重构** — 按需加载设计规范，驱动 UI 重构

详细教程见 `workshop_doc/` 目录。

## 环境变量

后端 (`backend/.env`)：
- `PORT` — 服务端口，默认 3001
- `JWT_SECRET` — JWT 签名密钥
- `DB_PATH` — SQLite 数据库路径

前端 (`frontend/.env`)：
- `VITE_API_URL` — 后端 API 地址，本地开发设为 `http://localhost:3001`

## License

MIT
