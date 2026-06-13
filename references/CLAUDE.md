# references/
> L2 | 父级: /CLAUDE.md

## 成员清单

pattern-fields.md: JSON 预处理手册，把记忆证据动作化，并用摩擦力修正 `receipt.energy/decision/stress/collab/total/verdict/type` 候选值。
gap-questions.md: JSON 槽位探针，只在 app.v1 目标字段低置信时生成侧写验证和困境二选一探针。
type-glyphs.md: 唯一类型素材查找表，绑定 canonical type、rarity 锚点、五维 glyph 修正和 ASCII `typeGlyph` 合法值。
receipt-json-contract.md: 唯一 app.v1 输出契约，定义固定字段、张力生成硬约束、票面微文案、长度限制、图片槽位、无图 ASCII 兜底和格式终检清单。
check.md: 定义安装完整性主动查漏协议，处理 app 页面、脚本、JSON 契约或资源缺失导致的残缺包。
CLAUDE.md: references 目录地图，保证资源文件职责不混杂。

## 架构边界

资源文件只写规则，不写主流程。主流程由上层 `SKILL.md` 调度。新增资源必须说明它让哪个 app.v1 JSON 槽位更确定；不能影响 JSON/HTML/PNG 的规则不进入默认生成路径。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
