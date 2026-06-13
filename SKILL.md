---
name: personality-receipt
description: Use this skill when the user asks for 人格小票, personality receipt, MBTI/type compression, self-pattern inference from memory, or a shareable receipt PNG/card. Read available context first, ask only 2-3 gap questions when needed, then produce a Chinese receipt as app.v1 JSON plus HTML/PNG via scripts/render-receipt.mjs. Also use it when this skill package appears incomplete or installation files need checking.
license: Proprietary
compatibility: Requires a POSIX shell, Node.js 22+, and a local Chrome/Chromium executable for receipt HTML/PNG rendering.
metadata:
  version: "0.3.6"
---

<!--
[INPUT]: 依赖当前对话、可访问记忆、用户提供文本、references/check.md 的前置完整性边界、pattern-fields.md/gap-questions.md 的分析规则、receipt-json-contract.md 的唯一输出契约、type-glyphs.md 的类型素材表和 app/assets/scripts 的渲染资源
[OUTPUT]: 对外提供中文人格小票生成流程、缺口提问流程、类型压缩规则、app.v1 JSON/HTML/PNG 渲染流程、无图 ASCII 查表兜底和安装后查漏流程
[POS]: personality-receipt 的主入口，负责从 app.v1 JSON 槽位反推证据、提问、压缩与 renderer 调用
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 人格小票生成器

先读记忆，再问缺口，最后打印一张中文人格运行小票。

不要把 MBTI 当结论。MBTI 只是压缩标签。真正要交付的是用户如何恢复能量、如何做决定、如何受压、如何协作、如何启动。

## 工作流

```text
app.v1 JSON 槽位反推
  -> 搜索记忆
  -> 按槽位提取动作化证据
  -> 只补问低置信槽位
  -> 压缩类型、稀有度、判词和总计
  -> 生成 app.v1 中文小票 JSON
  -> 校验 JSON
  -> 调用 renderer
  -> 输出 JSON/HTML/PNG 路径
```

## 逆向设计原则

最终产物是 `personality-receipt.app.v1` JSON，以及由它渲染出的 HTML/PNG。漏斗上方的所有文档都只服务一个目标：让 JSON 槽位更确定。

```text
pattern-fields.md        传感器：从记忆里寻找每个 receipt 槽位的证据
gap-questions.md         探针：只补问低置信槽位，回答必须能改写 JSON 值
receipt-json-contract.md 模具：唯一 app.v1 字段契约，收纳长度、文案和票面禁区
type-glyphs.md           素材表：按 type 查 rarity 和 ASCII typeGlyph
```

不帮助 app.v1 JSON、HTML 或 PNG 的内容，不进入默认生成路径。来源、证据、反证和长说明可以留在聊天摘要；机器小票只吃 JSON 契约。

## 0. 安装完整性检查

进入本 skill 后，先阅读 `references/check.md`。阅读是固定前置动作；是否执行查漏，由 `check.md` 里的故障信号决定，例如“加载 skill”、“安装 skill”、“跑不了”、“用不了”、“没加载出来”、“找不到脚本”、“页面打不开”、“HTML 没了”、“模板缺失”、“README 说的文件没有”或“检查安装”。

原则：

- 不从记忆重建缺失的 `.html`、`.mjs`、JSON、图片或长代码。
- 如果用户已经给出路径，直接检查，不重复问。
- 如果当前目录就是 skill 包，或可从 `npx skills list -g --json` 找到安装目录，直接检查对应目录。
- 先检查本地包是否包含 `SKILL.md`、`references/`、`assets/`、`scripts/`、`app/` 和对应 `CLAUDE.md`，再跑必要的语法/渲染烟测。
- 能在当前仓库或安装目录内安全修复 Markdown 配置和缺失同步问题时，主动修复并复测。
- 缺的是机器文件、长代码或模板时，不凭记忆补空壳；改用 GitHub 重新安装、clone 或同步后复测。
- 如果当前仓库本来没有某类文件，例如没有 `.sh`，不要把“不存在的上游文件”当成缺失。

## 1. 先搜索记忆

先用当前可访问的材料，不要直接发问卷。

优先查看：

- 当前对话里的稳定表达
- 用户提供的笔记、日记、聊天记录、项目描述
- 可用的本地记忆、历史上下文或连接器搜索结果
- 用户反复提到的卡点、目标、评价、隐喻和抗拒点

如果用户明确说“先搜索记忆”，必须先报告你看到了哪些证据类别，再决定是否补问。

## 2. 提取运行模式

把证据压成能直接填 JSON 的动作化候选：

- 能量模式 -> `receipt.energy`：补能或启动动作
- 决策模式 -> `receipt.decision`：降噪或定界动作
- 压力模式 -> `receipt.stress`：泄压或恢复动作
- 协作模式 -> `receipt.collab`：轻连接或协作接口动作

字段口径见 `references/pattern-fields.md`。提取时就动作化，不要先写抽象性格描述再二次翻译。证据不足时标记槽位置信度，不要硬凑。

## 3. 只问缺口问题

最多问 3 个问题。记忆足够时最多问 2 个。每个问题都必须绑定一个目标 JSON 槽位、真实情境锚点、候选假设和反证方向。没有锚点时，先收集一个具体场景，不直接发固定题库。

不要问：

- 你更内向还是外向？
- 你更理性还是感性？
- 你是 J 还是 P？

要问能暴露行为、并能改写 `receipt.energy/decision/stress/collab/total/verdict` 的题。提问生成规则见 `references/gap-questions.md`。

## 4. 选择类型素材

小票顶部放一个 3-5 行 ASCII 类型印章。它是运行模式的图标，不是装饰。

只使用 `references/type-glyphs.md`，最终只落到 `receipt.type`、`receipt.rarity` 和 `typeGlyph/typeImage`：

- `receipt.type` 首选查找表里的 canonical 原型。
- `receipt.rarity` 使用同名锚点；自由 type 也按查找表尺度校准。
- `typeGlyph` 只从查找表复制，不临场自由画图。
- 证据不足、原型未定或字段冲突时，用 `云团`。

不要复制 Claude Code 的具体图标。借机制，不借形象。

## 5. 类型压缩

给出 1-3 个候选类型，必须同时给支持证据和反证。

规则：

- 置信度通常不要超过 80%
- 类型候选不要超过 3 个
- 不能把类型说成身份、命运、心理诊断
- 不能为了让结论漂亮而忽略反证

如果用户只想娱乐，标为低置信度娱乐版。

字段咬合：

- `mbti` 是大众压缩标签，不是标题。
- `total` 是对 `mbti` 的精修或反叛，必须像整张票的金额总计。
- `verdict` 来自决策模式和压力模式的张力，不写随机格言。
- `rarity` 来自 type 语义和五维极端程度；越极端越稀有，但不代表越好。

## 6. 生成中文人格小票

最终小票不是聊天里的纯文字，而是 `app.v1 JSON -> app/index.html + app/app.js -> HTML/PNG`。默认必须渲染 HTML 和 PNG；不要把 fenced `text` 预览当成完成态。

内容必须遵守 `references/receipt-json-contract.md` 的字段和票面微文案口径，不要退化成普通报告。行动签、total 和 type 用中文；verdict 按契约使用英文短判词。

机器小票必须包含：

- 类型图或 ASCII 类型印章。
- CASHIER、PAYMENT、DATE、时间、序号和 receiptId。
- MBTI 压缩标签。
- energy、decision、stress、collab 四个中文行动签。
- total、type、rarity、verdict 和 barcode。

输出短句。像热敏纸小票。可以锋利，但不要羞辱用户。来源、证据、反证、协作说明和危险提示只放聊天分析，不进入 PNG。小票本体必须生成 app.v1 JSON，并交给 renderer 产出 HTML/PNG。

## 失败处理

没有足够记忆时：

```text
我现在没有足够记忆，不能装作已经看见模式。
先给我一个最近的真实场景锚点，我再问最多 2 个验证问题；如果仍然证据不足，只生成低置信度版本。
```

用户要求绝对判断时：

```text
不能给绝对类型。人格类型是压缩，不是身份证。
我可以给候选、证据、反证和使用说明。
```

## 质量检查

输出前检查：

- 如果用户报告安装、脚本、模板或页面缺失，是否先按 `references/check.md` 主动检查，已给路径时没有重复提问？
- 是否先读了记忆或说明没有可读记忆？
- 是否只问了带目标 JSON 槽位、真实锚点、候选假设和反证方向的缺口问题？
- 是否所有 pattern 都先动作化为 JSON 候选值？
- 是否每个低置信槽位都有补问、降级或低证据兜底？
- 是否把 MBTI 放进类型压缩，而不是当作标题？
- 是否有反证？
- 是否有可行动的协作说明？
- 是否中文主体和英文 `verdict` 都符合 JSON 契约？
- 是否避免心理诊断？
- 是否生成并校验 app.v1 JSON？
- 是否调用 `scripts/render-receipt.mjs` 并输出 JSON/HTML/PNG 绝对路径？

## 7. HTML/PNG 渲染

生成中文小票时，模型只产出 app.v1 JSON，不产出 HTML/CSS。票面唯一机器相是 `app/index.html + app/app.js`；renderer 只是把 JSON 注入 app 页面并调用 app 的 canvas 导出。HTML/PNG 不是可选装饰，而是默认完成态。

读取：

- `assets/receipt-model-template.json`：给模型填写的 app.v1 JSON 模板。
- `assets/sample-receipt.json`：app.v1 样例输入。
- `references/receipt-json-contract.md`：模型填 JSON 的字段契约和长度限制。
- `app/index.html`：唯一票面结构与样式。
- `app/app.js`：app.v1 注入、图片热敏化、canvas PNG 导出和 Web Share。
- `scripts/render-receipt.mjs`：app.v1 JSON -> PNG 的非交互包装器。

流程：

```text
小票判断
  -> app.v1 receipt JSON
  -> 按 `references/receipt-json-contract.md` 自检 JSON
  -> node scripts/render-receipt.mjs <json> --output outputs/<receiptId>.png
  -> 生成 outputs/<receiptId>.json + outputs/<receiptId>.html + outputs/<receiptId>.png 三件套
  -> 展示 JSON/HTML/PNG 绝对路径
```

JSON 只填槽位。排版属于 app 页面，不属于模型自由发挥。renderer 接受 app.v1；旧 flat receipt JSON 只作为兼容输入，不再作为首选契约。

如果 renderer 失败，任务未完成。根据 stderr 修 JSON、检查 Chrome 路径或按 `references/check.md` 查包，不要退回“只有文字版”作为完成结果。

出票模型规则：

- `receipt.cashier` 固定写 `CASHIER`。
- `receipt.cashierValue` 必须写当前实际生成 JSON 的模型或 agent 名；无法确认精确版本时写家族名或 agent 名，严禁把 `GPT-5` 当占位符照抄。
- app 和 renderer 只显示 `cashierValue`，不负责自动判断模型身份。

必填槽位：

```json
{
  "_contract": "personality-receipt.app.v1",
  "theme": "dailv",
  "typeImage": "",
  "typeImageMode": "clean",
  "typeGlyph": "▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝",
  "receipt": {
    "heading": "RECEIPT",
    "cashier": "CASHIER",
    "cashierValue": "Codex",
    "payment": "PAYMENT",
    "paymentValue": "YESHU",
    "dateLine": "DATE",
    "time": "2026-06-13 00:12",
    "counter": "NO.001",
    "receiptId": "PR_20260613_001_A7C3",
    "mbti": "INTJ",
    "energy": "喝热咖啡",
    "decision": "写三行再定",
    "stress": "找人吐槽",
    "collab": "约人散步",
    "total": "先结构后行动",
    "type": "白猫",
    "rarity": "8.0%",
    "verdict": "YOU ARE NOT A TYPE.",
    "barcode": "||| ||||| || ||| | |||"
  }
}
```

尺寸规则：

- 默认导出 `--scale 2`，适合聊天预览和分享。
- renderer 默认用 `--width 412`，让 app 内部票面逻辑宽度约 384px。
- 热敏打印机原生图用 `--scale 1`；大屏分享再另行调 `--width`、`--height`、`--scale`。

字段限制：

- `typeGlyph` 最多 5 行，每行不要超过 24 字符。
- `typeImage` 可选；有本地图片路径时优先使用图片，没图才使用 `typeGlyph`。
- `typeImageMode` 可选：`clean` 保留灰度插图，`stamp` 转高对比印章，`thermal` 转黑白抖动点阵；具体参数由 app 预设拥有。
- `receipt.energy/decision/stress/collab` 固定 4 项；值是行动签，不是百分比。分数可以留在分析过程里，PNG 只展示可执行的小动作。行动签要低成本、低风险、当天可做：补能、降噪、泄压、轻连接四类各给一步。
- `rarity` 是 type 的稀有度百分比；优先使用 `type-glyphs.md` 的同名锚点。自由 type 可以存在，但必须按该表尺度校准，并从最接近的 canonical 原型复制 `typeGlyph`。
- `mbti`、`total`、`verdict` 必须短。图片只放结论，不放证据长文。
- 证据、反证、协作说明可以放在聊天文字里，不塞进 PNG。

运行：

```bash
node scripts/render-receipt.mjs assets/sample-receipt.json
```

脚本必须非交互。失败时根据 stderr 修 JSON 或检查 Chrome 路径。
