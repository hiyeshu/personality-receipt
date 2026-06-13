# app/
> L2 | 父级: /CLAUDE.md

## 成员清单

index.html: 静态结构与样式层，承载动森绿外场、响应式小票预览、上传图片入口、分享字段编辑和控制区，票面不展示 match。
app.js: 行为层，读取可选 `window.PERSONALITY_RECEIPT_BOOTSTRAP/EXPORT_SCALE/AUTO_REPLAY`，负责 app.v1 数据注入、rarity 编辑和参考兜底、无图 ASCII 兜底、一键热敏化图片处理并染成当前墨色、出纸动效、Scrambl 扰动、响应式预览同步、分享字段同步、DOM 测量透明 PNG 导出和 Web Share。
CLAUDE.md: app 目录地图，记录静态演示页面职责。

## 架构边界

这里是用户可打开的静态页面，也是 PNG renderer 的唯一票面真相源。`index.html` 只管结构和样式，`app.js` 只管 app.v1 注入、交互和导出；真实 skill 判断仍由 `SKILL.md` 和 `references/` 负责。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
