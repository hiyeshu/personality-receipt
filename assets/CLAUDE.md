# assets/
> L2 | 父级: /CLAUDE.md

## 成员清单

sample-receipt.json: renderer 输入样例，使用 app.v1 契约展示人格小票图片所需的最小字段、type/rarity、可选 `typeImage`/`typeImageMode` 和无图 `typeGlyph`。
receipt-model-template.json: 模型填写模板，定义 app.v1 小票 JSON 槽位、整体墨色、类型图、图片模式、rarity 和无图 ASCII 字形。
CLAUDE.md: assets 目录地图，约束样例和模型契约的职责边界。

## 架构边界

这里放可被 agent 和脚本读取的静态 JSON 资源。票面 HTML 不在 assets，唯一票面由 `app/index.html + app/app.js` 拥有；assets 只保存 app.v1 样例、模型填写模板和无图 ASCII 兜底入口。人格判断仍由 `SKILL.md` 和 `references/` 承担。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
