---
name: personality-receipt
description: Generate personality receipts, 人格小票, MBTI/type compression, self README, collaboration interface notes, or memory-based self-pattern inference. Search available memory/context first, ask only 2-3 gap questions if needed, then output a Chinese receipt with an ASCII type stamp, operating patterns, evidence, counter-evidence, and collaboration guidance. When the user asks for PNG/image/card output, create receipt JSON and render it with scripts/render-receipt.mjs. When the skill was copied from Xiaohongshu/RedNote or another filtered surface, verify the local package against the GitHub truth source before using scripts/assets.
license: Proprietary
compatibility: Requires a POSIX shell, Node.js 18+, and a local Chrome/Chromium executable for PNG rendering.
metadata:
  version: "0.3.0"
---

<!--
[INPUT]: 依赖当前对话、可访问记忆、用户提供文本、references 下的格式规则、references/check.md 的真相源检查协议和 assets/scripts 的渲染资源
[OUTPUT]: 对外提供中文人格小票生成流程、缺口提问流程、类型压缩规则、PNG 小票渲染流程和安装后查漏流程
[POS]: personality-receipt 的主入口，负责路由到资源文件、约束最终输出并在需要时调用 renderer
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 人格小票生成器

先读记忆，再问缺口，最后打印一张中文人格运行小票。

不要把 MBTI 当结论。MBTI 只是压缩标签。真正要交付的是用户如何恢复能量、如何做决定、如何受压、如何协作、如何启动。

## 工作流

```text
可选真相源检查
  -> GitHub 对照
  -> 修复缺文件
  -> 再进入生成流程

搜索记忆
  -> 提取模式
  -> 询问缺口
  -> 生成类型印章
  -> 类型压缩
  -> 输出中文小票
  -> 可选渲染 PNG
```

## 0. 真相源检查

当用户说“小红书”、“红书”、“从帖子复制”、“加载 skill”、“安装 skill”、“缺文件”、“脚本找不到”、“页面打不开”、“HTML 没了”时，先读 `references/check.md`。

原则：

- GitHub 仓库是真相源，小红书/帖子/截图/复制文本都不是。
- 不从记忆重建缺失的 `.html`、`.sh`、`.mjs`、模板、图片或长代码。
- 先检查本地包是否包含 `SKILL.md`、`references/`、`assets/`、`scripts/`、`app/` 和对应 `CLAUDE.md`。
- 发现缺失时，要求用户从 GitHub 重新安装或 clone，再继续生成。
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

把证据压成四个核心模式：

- 能量模式：用户从哪里恢复能量，哪里消耗能量
- 决策模式：用户判断值得、不值得、该不该的方式
- 压力模式：用户受压后如何逃避、补偿或重建秩序
- 协作模式：别人怎么配合用户，最不容易制造阻力

字段口径见 `references/pattern-fields.md`。证据不足时不要硬凑。

## 3. 只问缺口问题

最多问 3 个问题。记忆足够时最多问 2 个。每个问题都必须是具体场景题。

不要问：

- 你更内向还是外向？
- 你更理性还是感性？
- 你是 J 还是 P？

要问能暴露行为的题。问题模板见 `references/gap-questions.md`。

## 4. 生成 ASCII 类型印章

小票顶部放一个 3-5 行 ASCII 类型印章。它是运行模式的图标，不是装饰。

使用 `references/buddy-stamps.md` 和 `references/type-glyphs.md`：

- 五维属性：自省、耐心、混沌、洞察、锋利
- 类型原型：由运行模式决定
- 稀有度：由证据清晰度决定，不代表人格高低
- ASCII：短、稳、可复制，最多 5 行
- 无图 fallback：从 `type-glyphs.md` 选同名原型，不临场自由画大图

不要复制 Claude Code 的具体图标。借机制，不借形象。

## 5. 类型压缩

给出 1-3 个候选类型，必须同时给支持证据和反证。

规则：

- 置信度通常不要超过 80%
- 类型候选不要超过 3 个
- 不能把类型说成身份、命运、心理诊断
- 不能为了让结论漂亮而忽略反证

如果用户只想娱乐，标为低置信度娱乐版。

## 6. 输出中文人格小票

最终输出必须是中文。默认使用 `references/receipt-style.md` 的热敏纸小票结构，不要退化成普通报告。

必须包含：

- ASCII 类型印章
- 票号、日期、来源和条码
- 来源
- 类型原型与五维属性
- 核心模式
- 类型压缩
- 使用说明
- 危险提示
- 判词

输出短句。像热敏纸小票。可以锋利，但不要羞辱用户。小票主体必须放进 fenced `text` 代码块。

## 失败处理

没有足够记忆时：

```text
我现在没有足够记忆，不能装作已经看见模式。
先问你 3 个场景问题，再生成低置信度版本。
```

用户要求绝对判断时：

```text
不能给绝对类型。人格类型是压缩，不是身份证。
我可以给候选、证据、反证和使用说明。
```

## 质量检查

输出前检查：

- 如果来自小红书/复制内容，是否先按 `references/check.md` 对照 GitHub 真相源？
- 是否先读了记忆或说明没有可读记忆？
- 是否只问了缺口问题？
- 是否把 MBTI 放进类型压缩，而不是当作标题？
- 是否有反证？
- 是否有可行动的协作说明？
- 是否全中文输出？
- 是否避免心理诊断？

## 7. 可选 PNG 渲染

当用户要求“生成图片”、“PNG”、“卡片”、“小票图”或“热敏纸图片”时，走固定模板渲染，不让模型自由排版。

读取：

- `assets/receipt-card.html`：384 x 620 逻辑尺寸的固定 HTML 模板。
- `assets/sample-receipt.json`：字段样例和槽位口径。
- `assets/receipt-model-template.json`：给模型填写的 app.v1 JSON 模板。
- `references/receipt-json-contract.md`：模型填 JSON 的字段契约和长度限制。
- `scripts/render-receipt.mjs`：HTML -> PNG renderer。

流程：

```text
小票判断
  -> receipt JSON
  -> node scripts/render-receipt.mjs <json> --output outputs/<receiptId>.png
  -> 展示 PNG 绝对路径
```

JSON 只填槽位。排版属于模板，不属于模型自由发挥。若输出给网页端，优先按 `receipt-json-contract.md` 生成 `personality-receipt.app.v1`；若输出给 renderer，则映射到下方 renderer 字段。

必填槽位：

```json
{
  "receiptId": "PR_20260613_001_A7C3",
  "date": "2026-06-13 00:12:00",
  "typeImage": "",
  "typeImageMode": "clean",
  "typeImageOptions": {
    "targetWidth": 220,
    "matrixSize": 4,
    "brightness": 1,
    "contrast": 1,
    "invert": false,
    "enableDither": true
  },
  "typeGlyph": "▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝",
  "mbti": "INTJ",
  "match": "64%",
  "items": {
    "Energy": "喝热咖啡",
    "Decision": "先别回消息",
    "Stress": "找人吐槽",
    "Collab": "约人散步"
  },
  "total": "先结构后行动",
  "type": "企鹅",
  "rarity": "12%",
  "verdict": "YOU ARE NOT A TYPE. YOU ARE A WAY."
}
```

尺寸规则：

- 默认导出 `--scale 2`，产物约 768 x 1240，适合聊天预览和分享。
- 热敏打印机原生图用 `--scale 1`，产物 384 x 620。
- 80mm 小票或大屏分享再另行调 `--width`、`--height`、`--scale`。

字段限制：

- `typeGlyph` 最多 5 行，每行不要超过 24 字符。
- `typeImage` 可选；有本地图片路径时优先使用图片，没图才使用 `typeGlyph`。
- `typeImageMode` 可选：`clean` 保留灰度插图，`stamp` 转高对比印章，`thermal` 转黑白抖动点阵。
- `typeImageOptions` 可选，复用原型算法口径：`targetWidth` 默认 220，`matrixSize` 支持 2/4/8/16，`brightness`、`contrast`、`invert`、`enableDither` 对应亮度、对比度、反色和抖动开关。
- `items` 固定 4 项：Energy、Decision、Stress、Collab；值是行动签，不是百分比。分数可以留在分析过程里，PNG 只展示可执行的小动作。行动签要低成本、低风险、当天可做：补能、降噪、泄压、轻连接四类各给一步。
- `mbti`、`total`、`verdict` 必须短。图片只放结论，不放证据长文。
- 证据、反证、协作说明可以放在聊天文字里，不塞进 PNG。

运行：

```bash
node scripts/render-receipt.mjs assets/sample-receipt.json
```

脚本必须非交互。失败时根据 stderr 修 JSON 或检查 Chrome 路径。
