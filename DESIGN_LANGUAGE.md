# 微博客应用设计语言

## 概述

微博客应用设计语言基于**现代社交媒体风格**构建，优先考虑用户参与度和内容发现。系统采用简洁的紫白配色主题，搭配圆角元素，营造友好、亲切的体验。

## 🎨 设计理念

### 核心原则
- **社交优先**：界面针对内容分享和用户互动进行优化
- **现代友好**：紫色强调色搭配圆角设计，增强亲和力
- **内容为中心**：简洁布局突出帖子和用户生成内容
- **响应式设计**：在手机、平板和桌面端提供无缝体验
- **性能优化**：轻量级样式确保快速加载和流畅交互
- **无障碍友好**：良好的对比度和清晰的视觉层次

### 视觉特征
- **简洁有吸引力**：适合社交互动和内容消费
- **现代感**：采用当代设计模式，保持新鲜感
- **专注**：最小化视觉干扰，突出帖子和用户互动
- **可扩展**：设计系统适用于不同屏幕尺寸和场景

## 🌈 色彩系统

### 主题配色

#### **浅色主题**（默认）
- **主色调**：白色背景搭配紫色强调和深色文字
- **强调色**：紫色（#8b5cf6）用于按钮、链接和交互元素
- **背景色**：浅灰色（#f5f8fa）作为应用背景，白色（#ffffff）用于卡片
- **文字层次**：深灰色（#14171a）用于主要文字，较浅灰色用于次要文字
- **风格**：简洁、现代、社交媒体风格
- **适用场景**：所有用户 - 提供最佳可读性和参与度

### 色彩变量

```css
/* CSS 变量 */
:root {
  --primary-color: #8b5cf6;        /* 紫色强调 */
  --secondary-color: #14171a;      /* 深色文字 */
  --background-color: #ffffff;     /* 卡片背景 */
  --app-background: #f5f8fa;       /* 应用背景 */
  --text-color: #14171a;           /* 主要文字 */
  --border-color: #e1e8ed;         /* 边框和分隔线 */
  --error-color: #e0245e;          /* 错误状态 */
  --success-color: #17bf63;        /* 成功状态 */
}

/* 文字颜色 */
--text-primary: #14171a;          /* 主要内容 */
--text-secondary: #657786;        /* 辅助文字 */
--text-muted: #8899a6;           /* 次要内容 */
--text-disabled: #aab8c2;        /* 禁用元素 */

/* 交互元素 */
--button-primary: #8b5cf6;        /* 主要按钮 */
--button-hover: #7c3aed;          /* 按钮悬停状态 */
--button-disabled: #c4b5fd;       /* 禁用按钮 */
--link-color: #8b5cf6;            /* 链接 */

/* 语义颜色 */
--like-color: #e0245e;            /* 点赞按钮激活 */
--follow-color: #8b5cf6;          /* 关注按钮 */
--warning-color: #ffad1f;         /* 警告 */
--info-color: #1da1f2;           /* 信息 */
```

### 色彩使用指南

#### **应用背景**
- **应用背景**：浅灰色（#f5f8fa）作为整体应用背景
- **卡片背景**：纯白色（#ffffff）用于帖子、个人资料和内容卡片
- **一致性**：整个应用中白色卡片置于浅灰色背景之上

#### **文字层次**
- **主要文字**：深灰色（#14171a）用于标题和主要内容
- **次要文字**：中灰色（#657786）用于时间戳、元数据
- **弱化文字**：浅灰色（#8899a6）用于不太重要的信息
- **禁用文字**：极浅灰色（#aab8c2）用于禁用元素

#### **交互元素**
- **主要按钮**：紫色背景（#8b5cf6）搭配白色文字
- **悬停状态**：深紫色（#7c3aed）用于悬停效果
- **链接**：紫色（#8b5cf6）与主色调一致
- **边框**：浅灰色（#e1e8ed）用于微妙的分隔

## 📝 排版系统

### 字体族
```css
/* 系统字体栈 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

/* 备选方案（来自 index.css） */
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### 字号比例
```css
/* 字号 */
xs: 12px     /* 小标签、API 显示 */
sm: 14px     /* 次要文字、时间戳 */
base: 16px   /* 正文、默认大小 */
lg: 18px     /* 强调内容 */
xl: 20px     /* 小标题 */
2xl: 24px    /* 章节标题 */
3xl: 30px    /* 页面标题 */
```

### 字重
```css
normal: 400    /* 正文 */
medium: 500    /* 标签、强调文字 */
semibold: 600  /* 按钮、重要文字 */
bold: 700      /* 用户名、强调 */
```

### 排版使用规范

#### **系统字体**
- **用途**：所有文字内容、UI 元素、按钮
- **特点**：高可读性、原生体验、跨平台
- **使用**：整个应用使用系统字体栈保持一致性

#### **文字层次**
- **标题**：粗体（700）用于用户名和重要标题
- **正文**：常规字重（400）用于帖子内容和描述
- **标签**：中等字重（500）用于表单标签和 UI 文字
- **按钮**：半粗体（600）用于交互元素

## 📏 间距系统

### 间距比例
```css
/* 间距值 */
xs: 4px      /* 紧凑间距、边框 */
sm: 8px      /* 小间隙、内边距 */
md: 16px     /* 标准间距 */
lg: 24px     /* 章节间距 */
xl: 32px     /* 大间隙 */
2xl: 48px    /* 主要区块 */
3xl: 64px    /* 页面区块 */
```

### 间距使用指南
- **xs（4px）**：圆角边框半径
- **sm（8px）**：小内边距、紧凑元素间距
- **md（16px）**：标准组件内边距、表单间距、卡片内边距
- **lg（24px）**：章节间距、大组件间隙
- **xl（32px）**：主要布局区块
- **2xl+（48px+）**：页面级间距、主视觉区域

## 🧩 组件系统

### 按钮系统
```css
/* 基础按钮 */
.button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 9999px;        /* 全圆角 */
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* 按钮状态 */
.button:hover {
  background-color: var(--button-hover);
}

.button:disabled {
  background-color: var(--button-disabled);
  cursor: not-allowed;
}

/* 按钮变体 */
.like-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0;
  font-size: 0.875rem;
  font-weight: normal;
}

.like-button.liked {
  color: var(--like-color);
}

.follow-button.following {
  background-color: #fff;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}
```

### 卡片系统
```css
/* 帖子卡片 */
.post-card {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

/* 个人资料卡片 */
.profile-header {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* 发帖卡片 */
.create-post {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}
```

### 表单元素
```css
/* 表单组 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* 输入框 */
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

/* 下拉选择 */
.sort-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
}
```

### 布局系统
```css
/* 应用布局 */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 头部 */
.app-header {
  background-color: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 内容区域 */
.content {
  flex: 1;
  display: flex;
  width: 100%;
  padding: 1rem;
}

/* 信息流布局 */
.feed-layout {
  display: flex;
  width: 100%;
  gap: 2rem;
  min-height: 0;
}

.feed-main {
  flex: 1;
  min-width: 0;
}

.feed-sidebar {
  width: 50%;
  display: none;
}
```

## 📱 响应式设计系统

### 断点
```css
/* 移动优先方式 */
/* 手机：默认样式（最大 768px） */
/* 平板：769px - 1024px */
/* 桌面：1025px+ */
/* 大屏桌面：1200px+ */
```

### 手机布局（≤768px）
```css
@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .feed-layout {
    flex-direction: column;
    gap: 0;
  }
  
  .feed-main {
    width: 100%;
    max-width: none;
  }
  
  .feed-sidebar {
    display: none;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
  }
}
```

### 桌面布局（≥769px）
```css
@media (min-width: 769px) {
  .content {
    padding: 1rem 2rem;
    max-width: none;
  }
  
  .feed-main {
    width: 50%;
    flex: none;
    max-width: 50%;
  }
  
  .feed-sidebar {
    display: block;
    padding-left: 1rem;
    border-left: 1px solid var(--border-color);
    flex: 1;
  }
}
```

### 大屏桌面布局（≥1200px）
```css
@media (min-width: 1200px) {
  .content {
    padding: 1rem 3rem;
  }
  
  .feed-layout {
    gap: 3rem;
  }
}
```

## 🎯 组件规格

### 导航栏
- **头部高度**：自适应，垂直内边距 0.5rem
- **固定定位**：固定在顶部，z-index 100
- **边框**：底部边框使用 --border-color
- **背景**：白色背景与卡片一致

### 帖子
- **卡片内边距**：标准帖子 1rem
- **圆角**：8px
- **边框**：1px solid --border-color
- **间距**：信息流中帖子间距 1rem

### 按钮
- **圆角**：9999px 全圆角按钮
- **内边距**：水平 0.5rem，垂直 1rem
- **字重**：600（半粗体）
- **过渡**：0.2s background-color 平滑悬停效果

### 表单
- **输入框内边距**：0.75rem 确保舒适的触控目标
- **圆角**：4px 微妙圆角
- **标签字重**：500（中等）清晰的层次结构

## 🔧 工具类

### 间距工具类
```css
/* 外边距 */
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mt-2 { margin-top: 2rem; }

/* 内边距 */
.p-1 { padding: 1rem; }
.p-2 { padding: 2rem; }

/* 间隙 */
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
```

### 布局工具类
```css
/* 弹性盒 */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.justify-between { justify-content: space-between; }
.align-center { align-items: center; }

/* 尺寸 */
.w-full { width: 100%; }
.max-w-400 { max-width: 400px; }
.max-w-600 { max-width: 600px; }
```

### 文字工具类
```css
/* 对齐 */
.text-center { text-align: center; }
.text-right { text-align: right; }

/* 颜色 */
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }

/* 字重 */
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

## 🎨 设计模式

### 社交媒体模式
- **用户链接**：粗体（700）搭配悬停下划线
- **时间戳**：次要文字颜色，小字号（0.875rem）
- **点赞按钮**：透明背景，激活时变色
- **关注按钮**：主色调，关注后反转样式

### 内容层次
- **帖子内容**：pre-wrap 空白处理确保正确换行
- **字数统计**：右对齐，次要文字颜色
- **错误消息**：浅红色背景搭配错误色文字
- **加载状态**：居中文字，次要颜色

### 交互状态
- **悬停效果**：主色调的深色变体
- **禁用状态**：浅紫色用于禁用按钮
- **聚焦状态**：浏览器默认聚焦指示器
- **激活状态**：点赞/关注项目的颜色变化

## 🔄 实施指南

### 开发流程
- **CSS 变量**：使用 CSS 自定义属性保持主题一致性
- **组件优先**：构建具有一致样式的可复用组件
- **移动优先**：从移动端样式开始，逐步增强到大屏幕
- **性能**：最小化 CSS 包体积，使用高效选择器

### 无障碍考虑
- **色彩对比**：确保文字有足够的对比度
- **触控目标**：交互元素最小 44px
- **聚焦指示**：为键盘导航保持可见的聚焦状态
- **语义化 HTML**：使用正确的 HTML 元素支持屏幕阅读器

### 浏览器支持
- **现代浏览器**：支持 Chrome、Firefox、Safari、Edge 当前版本
- **CSS 特性**：使用 CSS Grid、Flexbox、CSS 变量
- **降级方案**：必要时为旧版浏览器提供降级方案

---

**设计语言版本**：1.0
**最后更新**：2025-01-27
**状态**：已实施并生效
