# references/
> L2 | 父级: /CLAUDE.md

## 成员清单

pattern-fields.md: 定义记忆证据如何压成能量、决策、压力、协作等字段。
gap-questions.md: 定义缺口问题模板，确保少问、问场景、不做 MBTI 标准题。
buddy-stamps.md: 定义五维属性、开放类型原型、稀有度参考锚点和 ASCII 印章生成规则。
type-glyphs.md: 定义 app.v1 类型字段契约、稀有度校准口径、白猫/狐狸/水母/兔子优先字形、扩展 ASCII 印章库和无图 fallback 选择规则。
receipt-style.md: 定义中文热敏纸人格小票的 48 字版式、分隔线、条码、语气和示例。
receipt-json-contract.md: 定义模型填写 app.v1 小票 JSON 的固定字段、长度限制、主题、图片槽位和无图 ASCII 兜底。
check.md: 定义安装完整性主动查漏协议，处理 app 页面、脚本、JSON 契约或资源缺失导致的残缺包。
CLAUDE.md: references 目录地图，保证资源文件职责不混杂。

## 架构边界

资源文件只写规则，不写主流程。主流程由上层 `SKILL.md` 调度。新增资源必须说明被谁读取、解决哪个重复问题。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
