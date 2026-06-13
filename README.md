<!--
[INPUT]: 依赖 SKILL.md 的人格小票生成流程、references/check.md 的真相源检查协议、assets/app/scripts 的可运行实现和 GitHub 安装路径
[OUTPUT]: 对外提供 personality-receipt 的中文说明、真相源、安装方式、工作流、线上 demo、渲染命令、目录结构和完整性检查方法
[POS]: personality-receipt 的人类入口说明，面向 GitHub 读者解释这个 skill 如何从人格判断生成可分享小票
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 人格小票

把对话、记忆或一段自我描述，压成一张可分享的热敏纸风格人格小票。

它不是 MBTI 测试，也不是心理诊断。MBTI 只是短标签；真正有用的是小票里的行动签、类型原型、类型提示、稀有度和一句适合分享的判词。

## 三个真相源

```text
GitHub repo     # skill 包完整真相源
SKILL.md        # agent 工作流真相源
app/ + scripts/ # 页面预览与 PNG 渲染真相源
```

小红书、截图、帖子正文和复制文本都可能过滤 `.html`、脚本、长 JSON 或目录结构。只把它们当入口，不当安装源。

## 这个技能做什么

给 AI agent 一套完整的人格小票生成工作流：

1. 先读当前对话、可用记忆或用户提供材料。
2. 抽取能量、决策、压力、协作四类运行模式。
3. 只补问 2-3 个具体场景问题。
4. 压缩成 MBTI/type 提示，但不把类型当身份。
5. 生成类型印章、行动签、总评、类型和稀有度。
6. 输出中文热敏纸小票。
7. 需要图片时，写 receipt JSON 并用本地 renderer 或静态 app 生成 PNG。

## 安装

```bash
npx skills add hiyeshu/personality-receipt
```

或直接 clone：

```bash
git clone https://github.com/hiyeshu/personality-receipt.git
```

如果你是从小红书看到这个项目，不要复制帖子里的代码安装。回 GitHub 安装，再按 `references/check.md` 检查完整性。

## 触发词

说这些话会激活技能：

- “人格小票”
- “生成一张小票”
- “把我总结成 receipt”
- “MBTI 小票”
- “用我的记忆生成小票”
- “生成 PNG”
- “小票图片”
- “检查 skill 有没有缺文件”

## 网页 demo

线上 demo：

[https://personality-receipt.pages.dev/](https://personality-receipt.pages.dev/)

本地打开静态页面：

```bash
open app/index.html
```

页面支持：

- 移动端优先的小票预览
- 卡通打印机和出纸动效
- 传统中国色墨水：黑、黛蓝、黛绿、胭脂、赭茶、缃金
- 图片上传并热敏化
- 编辑 cashier、payment、MBTI、match、total、type、rarity、actions、verdict
- 透明 PNG 下载和 Web Share fallback

导出 ID 形如：

```text
PR_YYYYMMDD_001_A7C3
```

末尾随机段用来避免大家分享时编号完全撞车。

## JSON 契约

网页端优先使用：

- `assets/receipt-model-template.json`
- `references/receipt-json-contract.md`

核心字段：

```json
{
  "receiptId": "PR_20260613_001_A7C3",
  "cashierValue": "GPT-5",
  "paymentValue": "YESHU",
  "mbti": "INFJ",
  "match": "64%",
  "energy": "喝热咖啡",
  "decision": "先别回消息",
  "stress": "找人吐槽",
  "collab": "约人散步",
  "total": "柔软但警觉",
  "type": "白猫",
  "rarity": "12%",
  "verdict": "SOFT FACE. SHARP SENSOR."
}
```

四个 signal 值是行动签，不是分数。分数可以留在分析里，公开小票只放当天能做的小动作。

## PNG renderer

使用 Node renderer 生成确定性 PNG：

```bash
node scripts/render-receipt.mjs assets/sample-receipt.json
```

指定输出：

```bash
node scripts/render-receipt.mjs assets/sample-receipt.json --output outputs/PR_DEMO.png
```

默认 `2x` 导出：逻辑尺寸 `384 x 620`，产物约 `768 x 1240`。
`outputs/*.png` 是可复生成文件，默认不入库。

## 完整性检查

从小红书、帖子或复制文本加载过 skill 时，先检查：

```bash
test -f SKILL.md
test -f references/check.md
test -f assets/receipt-card.html
test -f scripts/render-receipt.mjs
test -f app/index.html
node --check scripts/render-receipt.mjs
node --check app/app.js
```

完整规则见 [`references/check.md`](references/check.md)。

## 边界

好边界是：

```text
agent reasoning -> receipt JSON -> local renderer/app -> PNG
```

不要把长证据、心理诊断、后台字段或邮件投递塞进图片。小票要短、可打印、可分享。

这个仓库不提供账号、邮件投递、托管存储或后端 secrets。以后若做发送服务，应放在独立可信 relay，不塞进 renderer。

## 依赖

| 工具 | 用途 |
|------|------|
| Node.js 18+ | 运行 renderer 和语法检查 |
| Chrome / Chromium | renderer 截图导出 PNG |
| 浏览器 | 打开静态 app |

静态 app 没有构建步骤。

## 目录结构

```text
personality-receipt/
├── README.md                         # 人类入口，说明真相源、安装、使用和检查
├── SKILL.md                          # skill 主入口，定义人格小票生成流程
├── CLAUDE.md                         # L1 项目地图
├── AGENTS.md                         # Codex/GEB 项目约束
├── agents/
│   ├── CLAUDE.md                     # agents 局部地图
│   └── openai.yaml                   # Codex UI 元数据
├── app/
│   ├── CLAUDE.md                     # app 局部地图
│   ├── index.html                    # 静态页面结构
│   └── app.js                        # 小票编辑、动画、导出和分享逻辑
├── assets/
│   ├── CLAUDE.md                     # assets 局部地图
│   ├── receipt-card.html             # renderer 使用的固定 HTML 模板
│   ├── receipt-model-template.json   # 模型填写用 app.v1 模板
│   └── sample-receipt.json           # renderer 样例输入
├── references/
│   ├── CLAUDE.md                     # references 局部地图
│   ├── check.md                      # GitHub 真相源查漏协议
│   ├── pattern-fields.md             # 运行模式字段口径
│   ├── gap-questions.md              # 缺口问题模板
│   ├── buddy-stamps.md               # 类型印章规则
│   ├── type-glyphs.md                # ASCII 类型字形库
│   ├── receipt-style.md              # 热敏纸文本样式
│   └── receipt-json-contract.md      # app.v1 JSON 契约
├── scripts/
│   ├── CLAUDE.md                     # scripts 局部地图
│   └── render-receipt.mjs            # JSON -> PNG renderer
└── outputs/
    └── CLAUDE.md                     # outputs 局部地图，PNG 本地生成不入库
```

## 验证

```bash
node --check app/app.js
node --check scripts/render-receipt.mjs
git diff --check
node scripts/render-receipt.mjs assets/sample-receipt.json --output /tmp/personality-receipt.png
```
