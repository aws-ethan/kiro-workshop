---
title: "练习：Agent Hooks 自动化"
weight: 51
---

## 什么是 Agent Hooks

Agent Hooks 是 Kiro 的自动化机制——当特定事件发生时，自动触发预定义的操作。你可以把它理解为 Git Hooks 的 AI 版本：不只是运行脚本，还可以让 AI Agent 参与决策。

### Hooks 能做什么

| 事件类型 | 触发时机 | 典型用途 |
|---------|---------|---------|
| `fileEdited` | 用户保存文件时 | 自动 lint、格式化检查 |
| `fileCreated` | 创建新文件时 | 检查命名规范、生成模板 |
| `promptSubmit` | 发送消息给 Agent 时 | 注入额外上下文或规则 |
| `preToolUse` | Agent 执行工具前 | 审查写操作、权限控制 |
| `postToolUse` | Agent 执行工具后 | 验证结果、记录日志 |
| `preTaskExecution` | Spec 任务开始前 | 检查前置条件 |
| `postTaskExecution` | Spec 任务完成后 | 运行测试、验证实现 |
| `userTriggered` | 用户手动触发 | 按需执行的自动化 |

### Hooks 的两种动作

- `askAgent`：发送提示词给 AI Agent，让它分析或执行操作
- `runCommand`：直接运行 Shell 命令

## 练习 1：保存时自动检查代码

### 场景

你希望每次保存 TypeScript 文件时，自动运行 ESLint 检查，及时发现问题。

### 步骤 1：创建 Hook

1. 在 Kiro 左侧边栏，找到 Kiro features 面板
2. 找到 "Agent Hooks" 部分
3. 点击 "+" 按钮创建新 Hook

或者通过命令面板：`Cmd + Shift + P` → 输入 `Open Kiro Hook UI`

### 步骤 2：配置 Hook

在 Hook 编辑界面中，填写以下信息：

- Name：`Lint on Save`
- Event Type：选择 `fileEdited`
- File Patterns：`*.ts, *.tsx`
- Action Type：选择 `runCommand`
- Command：`npm run lint --prefix frontend`

最终生成的 Hook 文件（位于 `.kiro/hooks/` 目录）应该类似：

```json
{
  "name": "Lint on Save",
  "version": "1.0.0",
  "description": "保存 TypeScript 文件时自动运行 ESLint 检查",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.ts", "*.tsx"]
  },
  "then": {
    "type": "runCommand",
    "command": "npm run lint --prefix frontend"
  }
}
```

### 步骤 3：测试 Hook

1. 打开任意 `.tsx` 文件（如 `frontend/src/pages/Feed.tsx`）
2. 做一个小修改（加个空格再删掉）
3. 保存文件（Cmd+S）
4. 观察——Kiro 应该自动运行 lint 命令并在聊天中显示结果

## 练习 2：Spec 任务完成后自动运行测试

### 场景

在使用 Spec 模式开发时，你希望每个任务完成后自动运行测试，确保新代码没有破坏现有功能。

### 步骤 1：创建 Hook

使用 Vibe 模式让 Kiro 帮你创建：

> 💬 提示词
> ```
> 帮我创建一个 Agent Hook：每当 Spec 任务完成后，自动运行后端测试（npm test --prefix backend）。
> ```

Kiro 会在 `.kiro/hooks/` 下创建一个 Hook 文件，内容类似：

```json
{
  "name": "Run Tests After Task",
  "version": "1.0.0",
  "description": "Spec 任务完成后自动运行后端测试",
  "when": {
    "type": "postTaskExecution"
  },
  "then": {
    "type": "runCommand",
    "command": "npm test --prefix backend"
  }
}
```

### 步骤 2：验证

下次你在 Spec 模式中完成一个任务时，Kiro 会自动运行测试。如果测试失败，你可以立即看到哪些测试出了问题。

## 练习 3：写操作审查 Hook（进阶）

### 场景

你希望 Kiro 在写入文件之前，先检查修改是否符合项目规范。这是一个 `preToolUse` Hook，可以在 AI 执行写操作前进行拦截。

### 步骤 1：创建 Hook

```json
{
  "name": "Review Write Operations",
  "version": "1.0.0",
  "description": "在写入文件前检查是否符合项目规范",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["write"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "在写入之前，请检查：1) 代码是否遵循项目现有的命名规范和文件组织方式；2) 是否有遗漏的错误处理；3) 新代码是否与 DESIGN_LANGUAGE.md 中的设计规范一致。如果发现问题，请先修正再写入。"
  }
}
```

### 步骤 2：理解 preToolUse 的工作方式

`preToolUse` Hook 会在 Kiro 每次尝试写入文件时触发：
- Kiro 准备写入文件 → Hook 触发 → Agent 审查 → 如果通过则继续写入
- 这相当于给 AI 加了一个"自我审查"环节
- `toolTypes` 支持的类别：`read`、`write`、`shell`、`web`、`spec`、`*`（全部）

> ⚠️ 注意：`preToolUse` Hook 会增加每次写操作的时间。在日常开发中，建议只在需要严格审查时启用。

## 练习 4：用 Vibe 模式创建自定义 Hook

现在你已经理解了 Hooks 的工作方式，尝试用自然语言让 Kiro 帮你创建一个自定义 Hook。

### 一些灵感

> 💬 提示词示例
> ```
> 帮我创建一个 Hook：当我在 backend/src/routes/ 下创建新文件时，提醒我需要在 server.js 中注册新路由。
> ```

这个 Hook 正好解决了上一节中遇到的路由注册遗漏问题。

其他有用的 Hook 想法：
- 创建新的数据库相关文件时，提醒检查是否需要更新 `database.js` 中的表定义
- 修改 API 路由时，自动运行相关的单元测试
- 提交代码前检查是否有 `console.log` 遗留

## 管理 Hooks

### 查看已有 Hooks

- 在 Kiro features 面板的 "Agent Hooks" 部分查看所有 Hook
- 或直接浏览 `.kiro/hooks/` 目录

### 启用/禁用 Hook

在 Hook 文件中没有 `disabled` 字段时默认启用。如果需要临时禁用，可以：
- 在 Agent Hooks 面板中管理
- 或直接删除/重命名 Hook 文件

## 反思

- Hooks 如何减少人为疏忽？自动化的检查和提醒消除了"忘记运行测试"或"忘记注册路由"这类问题。
- preToolUse vs postToolUse 的选择？preToolUse 适合"预防"（在问题发生前拦截），postToolUse 适合"验证"（在操作完成后检查结果）。
- 哪些重复性工作适合用 Hooks 自动化？想想你在开发中经常忘记或觉得繁琐的步骤——这些就是 Hooks 的最佳候选。

## 下一步

你已经学会了用 Hooks 自动化开发工作流。接下来，你将学习如何结合 Steering 和 Spec 模式，利用项目的设计语言文档来驱动 UI 重构——这是一个更高级的 Spec 应用场景。
