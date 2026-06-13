# scripts/
> L2 | 父级: /CLAUDE.md

## 成员清单

render-receipt.mjs: Node.js 非交互 renderer，读取 receipt JSON 和可选 `typeImageMode`，调用本机 Chrome/Chromium，将 `assets/receipt-card.html` 的 384x620 逻辑版式渲染为默认 2x PNG，文件出现即结束 Chrome。
CLAUDE.md: scripts 目录地图，记录可执行脚本的职责和边界。

## 架构边界

脚本只做可重复的机器执行，不做人格判断。所有输入来自 JSON，所有输出写入 `outputs/` 并在 stdout 返回结构化结果。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
