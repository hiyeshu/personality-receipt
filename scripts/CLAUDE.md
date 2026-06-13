# scripts/
> L2 | 父级: /CLAUDE.md

## 成员清单

render-receipt.mjs: Node.js 非交互 renderer，读取 app.v1 或 legacy receipt JSON，输出规范化 JSON，注入 `app/index.html`，固化单张小票 HTML fixture，加载 `app/app.js`，调用 app canvas 导出 API 生成 PNG，并在 stdout 返回结构化结果。
CLAUDE.md: scripts 目录地图，记录可执行脚本的职责和边界。

## 架构边界

脚本只做可重复的机器执行，不做人格判断，也不拥有票面模板。所有输入来自 JSON，所有输出写入 `outputs/` 或调用方指定 HTML/PNG 路径；stdout 只返回 JSON，diagnostics 走 stderr。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
