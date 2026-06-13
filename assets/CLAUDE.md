# assets/
> L2 | 父级: /CLAUDE.md

## 成员清单

receipt-card.html: HTML/CSS/canvas 固定小票模板，承载 384x620 PNG 的视觉结构、图片优先类型图槽、`typeImageMode`/ordered dithering 参数处理和 ASCII 兜底槽。
sample-receipt.json: renderer 输入样例，展示人格小票图片所需的最小字段契约和可选 `typeImage`/`typeImageMode`/`typeImageOptions`。
receipt-model-template.json: 模型填写模板，定义 app.v1 小票 JSON 槽位、整体墨色、类型图和图片模式。
CLAUDE.md: assets 目录地图，约束模板、样例和模型契约的职责边界。

## 架构边界

这里放可被脚本读取的静态资源。模板负责排版，样例负责 renderer 契约，模型模板负责 app.v1 槽位；人格判断仍由 `SKILL.md` 和 `references/` 承担。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
