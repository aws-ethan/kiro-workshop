/**
 * 合并 workshop_doc 下的所有 markdown 文件为一个文件。
 * 用法：node combine.js
 * 输出：_combined.md（供 pandoc 使用）
 */
const fs = require('fs');
const path = require('path');

const files = [
  '00_Kiro Workshop 前置操作.md',
  '01_生成 Steering 文档.md',
  '02_添加取消按钮.md',
  '03_添加评论功能.md',
  '04_修复部署脚本.md',
  '05_Agent Hooks 自动化.md',
  '06_使用 Spec 重构个人资料页.md',
];

const docDir = path.join(__dirname, '..');
let combined = '';

for (const file of files) {
  const filePath = path.join(docDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`跳过不存在的文件: ${file}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf-8');

  // 去掉各文件的 front-matter
  content = content.replace(/^---[\s\S]*?---\s*\n/, '');

  combined += content.trim() + '\n\n<div style="page-break-after: always;"></div>\n\n';
}

const outPath = path.join(__dirname, '_combined.md');
fs.writeFileSync(outPath, combined);
console.log(`✅ 合并完成: ${outPath}`);
