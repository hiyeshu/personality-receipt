# personality-receipt - 人格小票生成器
Codex Skill + Markdown References

<directory>
references/ - 人格小票规则资源，负责字段口径、缺口问题、类型印章、输出样式和安装查漏
agents/ - Codex UI 元数据，负责显示名、短描述和默认提示
assets/ - 静态资源层，负责 HTML 小票模板、样例 JSON 和模型 JSON 契约
scripts/ - 可执行脚本层，负责将 receipt JSON 渲染为 PNG
outputs/ - 生成物目录，只保留目录地图，PNG 由 renderer 本地生成且不入库
app/ - 静态演示页面，负责移动端动效预览、PNG 下载和 Web Share
</directory>

<config>
README.md - 人类入口，说明项目定位、网页 demo、JSON 契约和 renderer 用法
SKILL.md - skill 主入口，定义触发语、工作流、输出边界和资源路由
AGENTS.md - L1 项目宪法，记录仓库骨架、职责边界和 GEB 回环约束
.gitignore - 忽略 macOS 本地元数据和输出 PNG，避免生成噪音进入 skill 包
</config>

## 成员清单

README.md: 人类入口，介绍人格小票的能力边界、网页 demo、JSON 契约和 PNG 渲染命令。
SKILL.md: 技能入口，定义人格小票的触发语、工作流、输出边界和资源路由。
references/: 规则资源层，承载字段口径、缺口问题、类型印章、小票样式。
agents/: UI 元数据层，暴露 skill 在 Codex 界面的显示名、短描述和默认提示。
assets/: 静态资源层，承载固定 HTML 模板、renderer 样例和模型填写模板。
scripts/: 执行器层，承载非交互 renderer，将 JSON 小票变成 PNG。
outputs/: 生成物层，只保留目录地图，PNG 本地生成并被 `.gitignore` 排除。
app/: 静态页面层，承载视频风格的结构化小票动效和分享体验。
AGENTS.md: 仓库 L1 宪法，约束 skill 文件和资源目录的职责边界。
.gitignore: 仓库忽略规则，屏蔽 `.DS_Store` 和 `outputs/*.png`。

## 架构边界

`SKILL.md` 只放流程和路由。`references/` 放可替换的细则。`assets/` 放模板和样例。`scripts/` 放机器执行。`app/` 放静态演示页面。`agents/` 只放产品界面元数据，不参与人格判断。

## 依赖关系

```text
SKILL.md
  -> references/pattern-fields.md
  -> references/gap-questions.md
  -> references/buddy-stamps.md
  -> references/type-glyphs.md
  -> references/receipt-style.md
  -> references/check.md
  -> assets/receipt-card.html
  -> scripts/render-receipt.mjs

agents/openai.yaml
  -> SKILL.md

scripts/render-receipt.mjs
  -> assets/receipt-card.html
  -> outputs/<receiptId>.png (ignored generated artifact)

app/index.html
  -> 用户上传图片
  -> 浏览器 canvas / Web Share
```

## 变更日志

- 2026-06-12: 初始化人格小票生成器 skill，采用薄入口和 references 资源层。
- 2026-06-12: 将小票样式升级为热敏纸 receipt 骨架，补齐票号、明细、总计、条码和判词。
- 2026-06-13: 按 agentskills.io 标准补齐 assets/scripts/outputs，新增 HTML -> PNG renderer，并支持 `typeImage` 优先、ASCII 兜底。
- 2026-06-13: renderer 默认改为 2x 导出，逻辑版式保留 384x620，屏幕预览输出约 768x1240，热敏打印可用 `--scale 1`。
- 2026-06-13: 中文字体从全局 monospace 拆出，标题和中文结论优先使用系统中文黑体栈。
- 2026-06-13: 新增 `typeImageMode`，支持 clean/stamp/thermal 三种类型图处理模式。
- 2026-06-13: 将导入原型里的 ordered dithering 管线抽入模板，支持 targetWidth、matrixSize、brightness、contrast、invert、enableDither 参数。
- 2026-06-13: 将 `app/index.html` 收敛为动森绿外场和黑白热敏小票内核，去除代码窗口与粉色票据残留。
- 2026-06-13: 将 app 拆为 `index.html` 结构层和 `app.js` 行为层，新增卡通出纸动效、底部 touchbar、整体传统色墨水和透明无边框导出。
- 2026-06-13: 新增 `assets/receipt-model-template.json` 和 `references/receipt-json-contract.md`，将网页小票内容抽成模型可填写的 app.v1 JSON 契约。
- 2026-06-13: 将网页分享小票的后台字段 `source/confidence` 收敛为面向分享的 `scene/match`。
- 2026-06-13: 新增 `.gitignore` 屏蔽 `.DS_Store`，保持 skill 包干净。
- 2026-06-13: 将 app 上传图改为一键热敏化，默认使用 4x4 Bayer、brightness 0.85、contrast 1.15、dither enabled。
- 2026-06-13: 移除 app 小票店铺抬头，导出高度改为按内容计算，并将上传图近白背景透明化。
- 2026-06-13: 将 app 小票元信息改为 `CASHIER=模型名`、`PAYMENT=用户名`、`DATE` 标签，底行左侧时间与右侧 `NO.001` 对齐。
- 2026-06-13: 将 app 默认墨色改为 `dailv` 黛绿，保持页面、模板和 JSON 契约一致。
- 2026-06-13: 修正无图导出时 ASCII 类型印章与 `RECEIPT` 标题重叠的问题。
- 2026-06-13: 新增 `README.md`，给 GitHub 读者说明项目定位、网页 demo、JSON 契约和 renderer 用法。
- 2026-06-13: 新增 `references/check.md`，将小红书/复制文本导致的残缺安装收敛为 GitHub 真相源查漏协议。
- 2026-06-13: 将公开图片字段统一为 `type*`，并将类型字形资源更名为 `type-glyphs.md`。
- 2026-06-13: 在 `README.md` 补充 Cloudflare Pages 线上 demo 地址。
- 2026-06-13: 修正移动端预览适配，取消固定 430px 缩放布局，避免横向裁切和底部控制条遮挡。
- 2026-06-13: 清理 skill 包，移除导入原型和可复生成 PNG，新增 `outputs/*.png` 忽略规则。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
