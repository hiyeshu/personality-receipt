<!--
[INPUT]: 依赖 app/index.html 的 data-field 槽位、app/app.js 的 data/state 字段和 assets/receipt-model-template.json
[OUTPUT]: 对外提供模型填写人格小票 JSON 的字段契约、行动签口径、长度限制和输出规则
[POS]: references 的模型接口层，约束 AI 只填内容不碰排版，被 SKILL.md 和外部生成流程读取
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 小票 JSON 契约

这是给模型填写的内容契约。模型只产出 JSON，不产出排版代码。

## 输出形态

模型必须返回一个 JSON object，结构与 `assets/receipt-model-template.json` 一致：

```json
{
  "_contract": "personality-receipt.app.v1",
  "theme": "dailv",
  "typeImage": "",
  "typeImageMode": "clean",
  "typeGlyph": " /\\\\_/\\\\\n( o.o )\n > ^ <",
  "receipt": {}
}
```

## 允许的 theme

`theme` 只控制小票墨色，不控制打印机和按钮。默认使用 `dailv`，也就是绿色墨色。

```text
black
dailan
dailv
yanzhi
zhecha
xiangjin
```

## receipt 字段

固定字段，不要增删字段名。

注意：分享小票里不出现 `source`、`confidence`、`match` 这种模型后台字段。来源、证据强度和四维分数放在 analysis JSON；展示层只保留用户能分享的 `mbti`、`type`、`rarity` 和行动签。

```json
{
  "heading": "RECEIPT",
  "cashier": "CASHIER",
  "cashierValue": "GPT-5",
  "payment": "PAYMENT",
  "paymentValue": "YESHU",
  "dateLine": "DATE",
  "time": "2026-06-13 09:31",
  "counter": "NO.001",
  "receiptId": "PR_20260613_001_A7C3",
  "mbti": "INFJ",
  "energy": "喝热咖啡",
  "decision": "先别回消息",
  "stress": "找人吐槽",
  "collab": "约人散步",
  "total": "柔软但警觉",
  "type": "白猫",
  "rarity": "8.0%",
  "verdict": "SOFT FACE. SHARP SENSOR.",
  "barcode": "||| ||||| || ||| | |||"
}
```

## 字段口径

- `heading`: 固定 `RECEIPT`，不要改成中文。
- `cashier`: 固定 `CASHIER`，语义是出票者标签，不随模型变化。
- `cashierValue`: 撰写并填写这张 JSON 的实际模型或 agent 名，例如 `GPT-5`、`Claude Sonnet`、`Codex`。生成时必须按当前执行者更新，不要照抄模板示例；renderer 和 app 只显示该字段，不自动识别模型，缺省只兜底为 `MODEL`。
- `payment`: 固定 `PAYMENT`，语义是付款方。
- `paymentValue`: 用户名或分享名，例如 `YESHU`。
- `dateLine`: 固定 `DATE`，下一行左侧展示具体时间。
- `time`: 生成或修正时间，格式建议 `YYYY-MM-DD HH:mm`；展示在左下角，与 `counter` 同行。
- `counter`: 小票序号，第一张用 `NO.001`。
- `receiptId`: 票据 ID，例如 `PR_20260613_001_A7C3`；格式建议 `PR_YYYYMMDD_序号_随机码`，随机码用 4 位大写十六进制，避免多人分享时撞号；展示在整张票最底部，不和 `counter` 混用。
- `mbti`: MBTI 压缩标签，票面标签为 `MBTI`；不知道就写 `N/A`，不要写成诊断。
- `energy/decision/stress/collab`: 每项填一个可执行行动签，不填百分比；票面右栏标题为 `ACTION`。短到能被人当天照做，例如 `喝热咖啡`、`先别回消息`、`找人吐槽`、`约人散步`。
- `total`: 中文总计，最多 8 个汉字。
- `type`: 类型提示，票面标签为 `类型(TYPE)`；直接写分享友好的原型名，例如 `白猫`、`灯塔`、`云火花`、`档案盒`。
- `rarity`: 稀有度百分比，票面标签为 `稀有度(RARITY)`；参考 `buddy-stamps.md` 的锚点表校准尺度，但允许自由 type 自带百分比。
- `verdict`: 英文判词，最多 32 个字符。
- `barcode`: ASCII 条码，只用 `|`、空格和短横。

## 图片字段

- `typeImage`: 可空。由外部系统填本地路径、URL 或 data URL，表示顶部类型图像，不绑定具体动物。
- `typeImageMode`: `clean`、`stamp`、`thermal` 之一。
- `typeGlyph`: 可空。无 `typeImage` 时展示的 ASCII 类型印章，最多 5 行，每行不超过 24 字符；优先从 `references/type-glyphs.md` 选择，不临场乱画。

模型看不到图片文件时，不要编造路径，`typeImage` 留空，并填写 `typeGlyph`。

## 行动签选择原则

行动签不是建议清单，是小票上的一枚短签。它必须低成本、低风险、当天可做、一步完成。

```text
energy   补能或启动：喝热咖啡 / 晒十分钟 / 走一小圈 / 早点睡
decision 降低选择噪音：先别回消息 / 只选一件 / 写三行 / 明早再定
stress   泄压或放松：找人吐槽 / 洗热水澡 / 看个电影 / 慢呼吸
collab   轻连接：约人散步 / 发个语音 / 借个脑子 / 讲五分钟
```

避免医疗化、训诫化和消费化。不要写 `去治疗`、`控制情绪`、`买个大件` 这种重动作。

## 禁止

- 不要输出 Markdown 解释。
- 不要输出 HTML/CSS。
- 不要输出证据长文。
- 不要把人格类型写成诊断。
- 不要新增字段让前端猜。

## 最小填充策略

证据不足时也可以生成，但要收低置信度：

```json
{
  "type": "白猫",
  "rarity": "8.0%",
  "mbti": "N/A"
}
```
