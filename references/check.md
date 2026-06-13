<!--
[INPUT]: 依赖 SKILL.md 的前置阅读规则、完整性检查触发信号、GitHub 仓库文件结构、当前工作目录和用户本地安装目录
[OUTPUT]: 对外提供主动查漏流程、仓库文件对照清单、残缺包风险判断和修复路径
[POS]: references 的完整性边界层，被 SKILL.md 启动时先读，在安装、缺文件、脚本不可用或页面缺失场景执行，不参与人格判断或小票排版
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# check.md

用途：作为进入 skill 后必须先读的完整性边界，确认当前 skill 包是否完整安装。

阅读本文件不等于每次都执行查漏。只有用户报告脚本、页面、JSON 契约或资源缺失，或出现安装不可用信号时，先查完整性，再生成小票。不要用记忆或片段化内容补写机器文件。

## 触发场景

不要只做关键词匹配。用户表达出“这个 skill 包可能不完整、安装后不可用、教程路径和本地文件对不上”时，就先执行本文件。典型信号：

- 安装后说“跑不了”“用不了”“没反应”“没加载出来”“看不到这个 skill”
- 用户贴了安装目录、文件列表、报错堆栈或 `Cannot find module` / `No such file` / `ENOENT`
- `npx skills add` 后仍找不到 `personality-receipt`，或 `npx skills list -g --json` 里路径异常
- renderer 没有生成 PNG/HTML，或提示找不到 Chrome、`app.js`、`index.html`、JSON 输入
- 本地只有 `SKILL.md`，但没有 `references/`、`assets/`、`scripts/`、`app/`
- 用户说“照 README 做不行”“线上 demo 能开，本地不行”“clone 后缺东西”
- 加载 skill 后脚本找不到
- HTML 页面打不开
- assets、scripts、references 缺文件
- 想确认有没有遗漏
- 安装后 renderer 或网页 demo 不可用
- 旧教程提到 `assets/receipt-card.html`

## 对照源

优先对照 GitHub 仓库：

```text
https://github.com/hiyeshu/personality-receipt
```

本地内容应来自 GitHub 安装、clone 或同步。不要用零散文本补全代码、模板或脚本。

## 主动检查优先

默认不问，先查。按这个顺序定位目录：

1. 用户已给路径：直接进入该目录检查。
2. 当前工作目录含 `SKILL.md`：把当前目录当 skill 根。
3. 可运行 `npx skills list -g --json`：从结果里找 `personality-receipt` 的 `path`。
4. 常见路径兜底：检查 `~/.agents/skills/personality-receipt`、`~/.codex/skills/personality-receipt`、`~/.claude/skills/personality-receipt`。

只有以上路径全部失败，才用一句话索要路径。不要同时问安装方式、目录和缺失类别；这些都可以通过文件系统和清单检查推断。

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
references/type-glyphs.md
references/receipt-json-contract.md
assets/CLAUDE.md
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
test -f assets/receipt-model-template.json
test -f assets/sample-receipt.json
test -f scripts/render-receipt.mjs
test -f app/index.html
test -f app/app.js
node --check scripts/render-receipt.mjs
node --check app/app.js
```

需要看完整缺口时：

```bash
find . -maxdepth 2 -type f | sort
```

## 修复路径

先修能安全修的：

- Markdown、说明、路由文字过时：直接改 `SKILL.md` 或 `references/*.md`，再检查 `[PROTOCOL]` 与对应 `CLAUDE.md`。
- 安装目录存在但缺少上游文件：优先从当前 clone 或 GitHub 同步完整目录，不手写空壳。
- 机器文件缺失或不可确认来源：不要凭记忆重建 `.html`、`.mjs`、JSON 模板；重新安装或 clone。

重新安装：

```bash
npx skills add hiyeshu/personality-receipt
```

或直接 clone：

```bash
git clone https://github.com/hiyeshu/personality-receipt.git
```

修复后再运行检查命令。只有检查通过，才继续生成 PNG、编辑网页或运行 renderer。修复不了时，明确说缺什么、试了什么、下一条可执行命令是什么。

## 禁止事项

- 不根据零散文本补写 `.html` 或 `.mjs`。
- 不根据记忆重建脚本。
- 不把缺失文件简化成空壳。
- 不把 app 页面和 renderer 当成可选装饰；它们是 PNG 与分享体验的实际机器相。
- 不再要求 `assets/receipt-card.html`；票面 HTML 已统一到 `app/index.html`。
- 不让用户手工粘贴大段代码修复包；直接回 GitHub 仓库。

## 输出格式

检查后只输出三段：

```text
完整性：通过 / 不通过
缺失项：列出文件或目录
下一步：重新安装 / clone / 可以继续生成
```
