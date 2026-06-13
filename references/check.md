<!--
[INPUT]: 依赖 SKILL.md 的真相源检查触发规则、GitHub 仓库文件结构和用户本地安装目录
[OUTPUT]: 对外提供安装后查漏问题、GitHub 对照清单、过滤面风险判断和修复路径
[POS]: references 的完整性检查层，被 SKILL.md 在小红书/复制/安装/缺文件场景读取，不参与人格判断或小票排版
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# check.md

用途：确认当前 skill 包是不是从 GitHub 真相源完整安装的。

小红书、公众号、截图、帖子正文和复制粘贴都可能吞掉 `.html`、`.sh`、`.mjs`、长 JSON、尖括号片段或目录结构。遇到这种来源，先查完整性，再生成小票。

## 触发场景

用户出现这些说法时先执行本文件：

- 从小红书看到的
- 复制了帖子里的 skill
- 加载 skill 后脚本找不到
- HTML 页面打不开
- assets、scripts、references 缺文件
- 想确认有没有遗漏
- 要把这个 skill 发到小红书让别人安装

## 真相源

唯一真相源是 GitHub 仓库：

```text
https://github.com/hiyeshu/personality-receipt
```

本地内容必须来自 GitHub 安装、clone 或同步。不要用帖子正文补全代码。

## 最少问题

只问会影响修复路径的问题。最多问 3 个：

1. 你现在的 skill 是从 GitHub 安装，还是从小红书/帖子复制？
2. 你本地 skill 目录在哪里？
3. 你缺的是哪类文件：`SKILL.md`、`references/`、`assets/*.html`、`scripts/*`、还是网页 `app/`？

如果用户已经给出路径，直接检查，不重复问。

## 必查文件

从仓库根目录检查：

```text
SKILL.md
README.md
CLAUDE.md
AGENTS.md
references/CLAUDE.md
references/check.md
references/pattern-fields.md
references/gap-questions.md
references/buddy-stamps.md
references/type-glyphs.md
references/receipt-style.md
references/receipt-json-contract.md
assets/CLAUDE.md
assets/receipt-card.html
assets/receipt-model-template.json
assets/sample-receipt.json
scripts/CLAUDE.md
scripts/render-receipt.mjs
app/CLAUDE.md
app/index.html
app/app.js
agents/CLAUDE.md
agents/openai.yaml
```

如果 GitHub 上没有 `.sh`，本地没有 `.sh` 不算缺失。缺失判断只对照 GitHub 当前目录。

## 快速命令

在仓库根目录运行：

```bash
test -f SKILL.md
test -f references/check.md
test -f assets/receipt-card.html
test -f scripts/render-receipt.mjs
test -f app/index.html
node --check scripts/render-receipt.mjs
node --check app/app.js
```

需要看完整缺口时：

```bash
find . -maxdepth 2 -type f | sort
```

## 修复路径

优先重新安装：

```bash
npx skills add hiyeshu/personality-receipt
```

或直接 clone：

```bash
git clone https://github.com/hiyeshu/personality-receipt.git
```

修复后再运行检查命令。只有检查通过，才继续生成 PNG、编辑网页或运行 renderer。

## 禁止事项

- 不根据小红书正文补写 `.html`。
- 不根据截图重建脚本。
- 不把缺失文件简化成空壳。
- 不把 app 页面和 renderer 当成可选装饰；它们是 PNG 与分享体验的实际机器相。
- 不让用户手工粘贴大段代码修复包；直接回 GitHub 真相源。

## 输出格式

检查后只输出三段：

```text
完整性：通过 / 不通过
缺失项：列出文件或目录
下一步：重新安装 / clone / 可以继续生成
```
