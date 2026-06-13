# test/
> L2 | 父级: /CLAUDE.md

## 成员清单

inputs/receipt-ascii-focus.json: app.v1 验收输入，`typeImage` 为空，使用聚焦型 ASCII 类型印章。
inputs/receipt-ascii-spark.json: app.v1 验收输入，`typeImage` 为空，使用火花型 ASCII 类型印章。
inputs/receipt-ascii-order.json: app.v1 验收输入，`typeImage` 为空，使用秩序型 ASCII 类型印章。
inputs/receipt-image-upload.json: app.v1 验收输入，`typeImage` 为 PNG data URL，验证有上传图时渲染图片分支。
html/PR_TEST_ASCII_FOCUS.html: 第一组 app HTML fixture，加载真实 `app/index.html` 结构和 `app/app.js` 行为。
html/PR_TEST_ASCII_SPARK.html: 第二组 app HTML fixture，加载真实 `app/index.html` 结构和 `app/app.js` 行为。
html/PR_TEST_ASCII_ORDER.html: 第三组 app HTML fixture，加载真实 `app/index.html` 结构和 `app/app.js` 行为。
html/PR_TEST_IMAGE_UPLOAD.html: 第四组 app HTML fixture，加载 PNG `typeImage` 并验证非 ASCII 分支。
png/PR_TEST_ASCII_FOCUS.png: 第一组由 `scripts/render-receipt.mjs` 调用 app 导出的 PNG 小票，验证无上传图时展示 ASCII。
png/PR_TEST_ASCII_SPARK.png: 第二组由 `scripts/render-receipt.mjs` 调用 app 导出的 PNG 小票，验证不同输入得到不同内容和 ASCII。
png/PR_TEST_ASCII_ORDER.png: 第三组由 `scripts/render-receipt.mjs` 调用 app 导出的 PNG 小票，验证无图 ASCII 链路稳定。
png/PR_TEST_IMAGE_UPLOAD.png: 第四组由 `scripts/render-receipt.mjs` 调用 app 导出的 PNG 小票，验证有上传图时展示热敏化图片。
CLAUDE.md: test 目录地图，记录 app.v1 输入、app HTML fixture 和 PNG 导出物职责。

## 架构边界

`test/` 是链路验收目录，不承载产品逻辑。`inputs/` 是 app.v1 模型槽位结果，`html/` 是 app 页面 fixture，`png/` 是正式 renderer 调用 app canvas 得到的导出物。无上传图样例必须展示 ASCII；带 PNG `typeImage` 样例必须展示图片分支。本目录验证两条分支、不同输入的多样输出，以及 renderer 与 app 的同源导出。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
