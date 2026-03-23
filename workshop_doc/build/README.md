# Workshop 文档 PDF 构建指南

将 `workshop_doc/` 下的所有 Markdown 文档合并并导出为一份 PDF 手册。

## 前置依赖

- Node.js 18+
- [pandoc](https://pandoc.org/)（Markdown → HTML）
- [puppeteer-core](https://www.npmjs.com/package/puppeteer-core)（HTML → PDF，使用本地 Chrome）
- Google Chrome（已安装在系统中即可）

安装依赖：

```bash
# macOS
brew install pandoc

# 项目根目录下安装 puppeteer-core
npm install --no-save puppeteer-core
```

## 构建步骤

在项目根目录执行以下三步：

```bash
# 1. 合并所有 Markdown 为一个文件
node workshop_doc/build/combine.js

# 2. 用 pandoc 将 Markdown 转为带样式的 HTML
pandoc workshop_doc/build/_combined.md \
  -o workshop_doc/build/_combined.html \
  --standalone --embed-resources \
  --metadata title="Kiro Workshop 手册" \
  --css=workshop_doc/build/style.css

# 3. 用 puppeteer-core + 本地 Chrome 生成 PDF
node workshop_doc/build/to-pdf.js
```

输出文件：`workshop_doc/Kiro_Workshop_手册.pdf`

## 文件说明

| 文件 | 用途 |
|------|------|
| `combine.js` | 合并所有 Markdown，去掉 front-matter，添加分页符 |
| `to-pdf.js` | 调用本地 Chrome 将 HTML 渲染为 A4 PDF，带页眉页脚 |
| `style.css` | PDF 样式（紫色主题，匹配项目设计语言） |
| `_combined.md` | 中间产物，合并后的 Markdown（可删除） |
| `_combined.html` | 中间产物，pandoc 生成的 HTML（可删除） |

## 自定义

- 修改 `style.css` 调整 PDF 样式
- 修改 `combine.js` 中的 `files` 数组调整文档顺序或增删章节
- 修改 `to-pdf.js` 中的 `page.pdf()` 参数调整页面尺寸、页边距等
