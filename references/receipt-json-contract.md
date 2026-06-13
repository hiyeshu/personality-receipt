<!--
[INPUT]: 依赖 app/index.html 的 data-field 槽位、app/app.js 的 data/state 字段、assets/receipt-model-template.json、pattern-fields.md 的行动签落点和 type-glyphs.md 的类型素材表
[OUTPUT]: 对外提供模型填写人格小票 JSON 的唯一字段契约、MBTI 标准/N/A 闸门、展示层语义闸门、张力生成硬约束、票面微文案口径、行动签限制、长度限制、格式终检清单和输出规则
[POS]: references 的模型接口层，约束 AI 只填内容不碰排版，被 SKILL.md 和外部生成流程读取
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 小票 JSON 契约

这是给模型填写的内容契约。模型只产出 JSON，不产出排版代码；renderer 再把 JSON 渲染为 HTML/PNG，这才是人格小票完成态。

本文件是最终输出的唯一模具。字段结构、长度限制、微文案口径和票面禁区都在这里定义；排版归 `app/index.html + app/app.js`，类型字形归 `references/type-glyphs.md`。

## 逆向设计定位

本文件是整个 skill 的唯一模具。上游 `pattern-fields.md` 和 `gap-questions.md` 的存在，只是为了让这里的字段更确定。

```text
证据 -> 动作化候选 -> 展示层语义闸门 -> app.v1 JSON -> app/index.html + app/app.js -> HTML/PNG
```

如果某条规则不能帮助填写、校验或渲染下面的字段，它不属于本契约。

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
  "cashierValue": "Codex",
  "payment": "PAYMENT",
  "paymentValue": "YESHU",
  "dateLine": "DATE",
  "time": "2026-06-13 09:31",
  "counter": "NO.001",
  "receiptId": "PR_20260613_001_A7C3",
  "mbti": "INFJ",
  "energy": "喝热咖啡",
  "decision": "写三行再定",
  "stress": "找人吐槽",
  "collab": "约人散步",
  "total": "先结构后行动",
  "type": "白猫",
  "rarity": "8.0%",
  "verdict": "SOFT FACE. SHARP SENSOR.",
  "barcode": "||| ||||| || ||| | |||"
}
```

## 字段口径

- `heading`: 固定 `RECEIPT`，不要改成中文。
- `cashier`: 固定 `CASHIER`，语义是出票者标签，不随模型变化。
- `cashierValue`: 撰写并填写这张 JSON 的实际模型或 agent 名，例如 `Codex`、`Tabbit`、`Claude Sonnet`。生成时必须按当前执行者更新；无法确认精确版本时写家族名或 agent 名，只有确认后才写具体版本。严禁因为模板示例填写 `GPT-5` 这种占位符；renderer 和 app 只显示该字段，不自动识别模型，缺省只兜底为 `MODEL`。
- `payment`: 固定 `PAYMENT`，语义是付款方。
- `paymentValue`: 用户名或分享名，例如 `YESHU`。
- `dateLine`: 固定 `DATE`，下一行左侧展示具体时间。
- `time`: 生成或修正时间，格式使用 `YYYY-MM-DD HH:mm`；展示在左下角，与 `counter` 同行。
- `counter`: 小票序号，第一张用 `NO.001`。
- `receiptId`: 票据 ID，例如 `PR_20260613_001_A7C3`；格式使用 `PR_YYYYMMDD_序号_随机码`，随机码用 4 位大写十六进制，避免多人分享时撞号。`序号` 必须和 `counter` 的数字一致，例如 `NO.001` 对应 `PR_20260613_001_A7C3`；同一任务多张小票时二者一起递增。
- `mbti`: MBTI 压缩标签，票面标签为 `MBTI`；只允许标准 16 型四字母或 `N/A`。低置信时先问一个能改写判断的真实场景问题；用户不答或回答后仍不能确定时写 `N/A`。禁止 `XNTJ`、`INXJ`、`X***` 或“部分确定”这类半成品标签，也禁止为了好看硬编标准类型。它是大众索引，不是整张票的灵魂。
- `energy/decision/stress/collab`: 每项填一个可执行行动签，不填百分比；票面右栏标题为 `ACTION`。短到能被人当天照做，例如 `喝热咖啡`、`写三行再定`、`找人吐槽`、`约人散步`。禁止否定句和禁令式表达，把 `别想太多` 改成 `慢呼吸三次`，把 `不要社交` 改成 `关掉手机`。
- `total`: 中文总计，最多 8 个汉字；它是整张票的金额总计，是用户运行模式的最终价值缩影。禁止写人格摘要、MBTI 同义词、标点、空格和英文。标准 MBTI 可用时，必须来自 `mbti` 的反叛或精修；`mbti=N/A` 时，必须来自核心模式和最主要摩擦。格式是张力词或意象词，例如 `在秩序中找裂缝`、`精密如表跳如火`、`柔软但有硬边`。
- `type`: 类型原型，票面标签为 `类型(TYPE)`；直接写分享友好的原型名，例如 `白猫`、`灯塔`、`云火花`、`档案盒`。
- `rarity`: 稀有度百分比，票面标签为 `稀有度(RARITY)`；优先使用 `type-glyphs.md` 同名原型的锚点值，自由 type 也必须按该表尺度给出百分比。
- `verdict`: 英文判词，硬上限 32 个字符，目标区间 20-25 个可见字符；它必须由 `decision_pattern x stress_pattern` 压缩而来。格式是决策主词加压力副词或形容词，例如 `QUIET HUNTER. NOISY MIND.`、`HARD EDGE. SOFT EXIT.`。禁止随机格言、心理评语和整句解释；避免过多 `W`、`M` 这类宽字符，防止热敏纸窄排折行。
- `barcode`: ASCII 条码，只用 `|` 和空格。

## 展示层语义闸门

renderer 只校验 JSON 能被渲染；本闸门校验字段是否该出现在公开小票上。先过语义，再渲染。

```text
receipt.energy
  必须  补能或启动，身体/环境/节奏层的一步小动作
  禁止  工作任务、证据检索、方法论模板、抽象口号
  拒例  画三格图 / 关门读源码 / 锁真相源

receipt.decision
  必须  降噪或定界，让选择变少的一步动作
  禁止  纯理念、技术偏好、归属判断、没有动词的归因标签
  可改  锁真相源 -> 写三行再定 / 圈出边界

receipt.stress
  必须  泄压或恢复，降低负荷的一步小动作
  禁止  诊断、查证、debug、继续工作、证明自己
  拒例  读原始日志 / 查一条日志 / 看源码

receipt.collab
  必须  轻连接或协作接口，让别人低成本接入
  禁止  完整方法论、价值宣言、需要大量上下文的命令
  可用  给我目标 / 借个脑子 / 讲五分钟
```

技术证据只属于分析层。它可以影响 `decision_pattern`、`total` 或聊天摘要，但不能原样泄漏进 `energy/stress/collab`。能消失的分支比能写对的分支优雅：不要给技术用户开特殊口子，统一把证据翻译成当天能做的短动作。

## 字段咬合

这些字段必须像一张票，而不是彼此无关的标签。

```text
energy/decision/stress/collab
  来自 pattern-fields.md 的动作化候选；四项共同构成 ACTION 明细。

mbti -> total
  mbti 给大众索引，total 给精修判断。mbti 只能是标准 16 型或 N/A；total 必须比 mbti 更具体。

decision x stress -> verdict
  判词必须写决策方式和压力反应之间的张力。
  公式：decision_pattern x stress_pattern -> verdict。
  例：安静规划 x 压力噪音 -> QUIET HUNTER. NOISY MIND.
  例：设定边界 x 软化退出 -> HARD EDGE. SOFT EXIT.

type + 五维极端值 -> rarity
  越极端越稀有；低证据不装稀有，用云团和保守百分比。

type + total + stress + 五维最高维 -> typeGlyph
  无图印章要像这个 type 的低分辨率影子，并受五维最高维修正；它不是装饰贴纸。
```

## 张力生成硬约束

`total` 和 `verdict` 是小票的两个钉子。它们不是总结栏，而是摩擦的压缩结果。

```text
total
  禁止  人格摘要 / MBTI 同义词 / 标点空格英文
  必须  有效 mbti 的反叛或精修；mbti=N/A 时使用核心模式 + 最主要摩擦
  格式  张力词或意象词，最多 8 个汉字

verdict
  禁止  随机格言 / 心理评语 / 整句解释 / 超过 32 字符
  必须  decision_pattern x stress_pattern
  格式  英文短戳记，目标 20-25 个可见字符
```

如果找不到摩擦，不要伪造文学感：`total` 写低证据缩影，`verdict` 写最稳定的动作张力，`rarity` 保守。

## 图片字段

- `typeImage`: 可空。由外部系统填本地路径、URL 或 data URL，表示顶部类型图像，不绑定具体动物。
- `typeImageMode`: `clean`、`stamp`、`thermal` 之一。
- `typeGlyph`: 可空。无 `typeImage` 时展示的 ASCII 类型印章，最多 5 行，每行不超过 24 字符；优先从 `references/type-glyphs.md` 选择，不临场乱画。

模型看不到图片文件时，不要编造路径，`typeImage` 留空，并填写 `typeGlyph`。

## 票面文案口径

JSON value 要像热敏纸小票，不像人格报告。短、硬、可分享，只放结论，不放推理过程。

允许进入分享小票的内容，只能落在 app.v1 JSON 的这些槽位：

```text
typeGlyph / typeImage
receipt.cashierValue
receipt.paymentValue
receipt.time
receipt.counter
receipt.receiptId
receipt.mbti
receipt.energy
receipt.decision
receipt.stress
receipt.collab
receipt.total
receipt.type
receipt.rarity
receipt.verdict
receipt.barcode
```

禁止进入票面的内容：

- 来源、记忆来源、材料来源。
- 支持证据、反证、证据缺口。
- `confidence`、`match`、分数、五维属性数值。
- 长说明、使用手册、危险提示、心理解释。
- 第二套票面字段，例如 `范围`、`运行明细`、`主模式`、`类型提示`。

`receipt.type` 必须是分享友好的中文原型名，不写人格优劣，不写诊断名。`receipt.verdict` 像底部戳记，不像心理评语。聊天分析可以解释证据，小票本体只负责被保存和分享。

## 行动签选择原则

行动签不是建议清单，是小票上的一枚短签。它必须低成本、低风险、当天可做、一步完成。

```text
energy   补能或启动：喝热咖啡 / 晒十分钟 / 走一小圈 / 早点睡
decision 降低选择噪音：只选一件 / 写三行再定 / 明早再回 / 画出边界
stress   泄压或放松：找人吐槽 / 洗热水澡 / 看个电影 / 慢呼吸三次
collab   轻连接：约人散步 / 发个语音 / 借个脑子 / 讲五分钟
```

避免医疗化、训诫化、消费化和否定句。不要写 `去治疗`、`控制情绪`、`买个大件`、`别想太多`、`不要社交` 这种重动作或禁令。

## 禁止

- 不要输出 Markdown 解释。
- 不要输出 HTML/CSS。
- 不要输出证据长文。
- 不要把人格类型写成诊断。
- 不要新增字段让前端猜。
- 不要再输出 Markdown 票据骨架或 48 字符宽文本收据。

## 格式终检清单

返回前逐项自检，任何一条不满足都先修 JSON：

- 最外层必须是 JSON object，不能包 Markdown、代码解释或注释。
- 所有 key 严格匹配大小写，例如 `receiptId`，不能写成 `receiptid`。
- `_contract` 必须在顶层，值必须是 `personality-receipt.app.v1`。
- `receipt` 必须是顶层对象下的对象；不要把 receipt 字段拍平成顶层。
- `typeGlyph` 字符串里的换行必须使用转义序列 `\n`，严禁直接回车破坏 JSON 语法。
- `receiptId` 的序号段必须和 `counter` 数字一致。
- `mbti` 必须是标准 16 型或 `N/A`，不得出现 `X***`、`部分确定`，也不得在低证据时硬编类型。
- `energy/decision/stress/collab` 都是中文短动宾行动签，不是否定句、禁令或长建议。
- 四个行动签是否通过展示层语义闸门：补能、降噪、泄压、轻连接各归其位？
- 是否没有把源码、日志、真相源、画图模板、英文口号直接塞进展示字段？
- `total` 不含标点、空格或英文，且不超过 8 个汉字。
- `total` 是否来自有效 `mbti` 的反叛或精修；`mbti=N/A` 时是否来自核心模式和最主要的一条摩擦？
- `type` 不是诊断、身份或优劣评价。
- `verdict` 是否严格来自 `decision_pattern x stress_pattern`，而不是随机漂亮话？
- `verdict` 以 20-25 个可见字符为佳，绝不超过 32 个字符。
- `barcode` 只含 `|` 和空格。

## 低证据填充策略

证据不足时也必须返回完整 app.v1 JSON，不允许只返回下面几个字段。低证据只改变 `receipt` 内的判断值，结构仍以 `assets/receipt-model-template.json` 为准。

```json
{
  "receipt": {
    "mbti": "N/A",
    "type": "云团",
    "rarity": "14.0%",
    "total": "还在成形"
  }
}
```

聊天分析里说明“低证据版本”；不要在票面新增 `scope`、`source`、`confidence` 或 `lowEvidence` 字段。
