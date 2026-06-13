<!--
[INPUT]: 依赖 pattern-fields.md 的运行模式和 receipt-json-contract.md 的 type/typeGlyph/rarity 字段契约
[OUTPUT]: 对外提供唯一类型原型查找表、稀有度锚点、ASCII typeGlyph 合法值和无图 fallback 选择规则
[POS]: references 的视觉素材库，被 SKILL.md 和 app fallback 读取；只供查表，不生成新字段
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# 类型 ASCII 查找表

本文件是 `typeGlyph` 的唯一素材库。模型不临场自由画图，只根据 `receipt.type` 选择同名原型，复制对应 ASCII 到 JSON。

## 查表协议

```text
receipt.type 命中表内原型      -> 复制同名 glyph，rarity 使用同名锚点
receipt.type 是同义词          -> 映射到 canonical type，再复制 glyph
receipt.type 是自由新原型      -> 选最接近的 canonical glyph，rarity 按锚点尺度校准
证据不足或无法归类            -> 使用 云团
```

`typeGlyph` 只允许来自本表。不要新增 `glyphVariant`、`shape`、`pose` 等隐藏字段；不要生成大图；不要为了好看突破 5 行限制。

## 原型选择信号

这些信号来自 analysis，不进入 app.v1 JSON：

```text
自主 / 警觉 / 讨厌被控制节奏       -> 白猫 / 猫
聪明 / 绕行 / 先试探再接近         -> 狐狸
敏感 / 漂浮 / 受环境电流影响       -> 水母
低攻击 / 快反应 / 容易受惊         -> 兔子
表达轻快 / 边说边想               -> 鸭
边界强 / 保护秩序                 -> 鹅
多线程 / 同时抓多个变量            -> 章鱼
高洞察 / 慢判断 / 先看结构         -> 猫头鹰
耐心高 / 压力下维持秩序            -> 企鹅
长周期 / 慢启动 / 续航强            -> 乌龟
慢热 / 安全感驱动                 -> 蜗牛
高混沌 / 高能量 / 创造易过热        -> 龙
旁观 / 抽离现场                   -> 幽灵
系统化 / 流程化 / 靠规则恢复        -> 机器人
锋利 / 边界硬 / 外冷内敏            -> 仙人掌
安静吸收 / 环境敏感               -> 蘑菇
低置信度 / 未定 / 还在成形          -> 云团
```

## 稀有度尺度

稀有度不是价值判断，也不是置信度。它只是类型系统里的相对少见程度。

```text
2% - 4%      极少见，结构极端或张力很强
5% - 8%      少见，有清晰运行风格
9% - 13%     较常见，有稳定偏好但不极端
14% - 18%    未定、柔性或低证据
```

自由 type 必须按这个尺度写 `receipt.rarity`，但 `typeGlyph` 仍从下面的 canonical glyph 里复制。

## Canonical Lookup

### 白猫

```text
rarity: 8.0%
desc: 自主性强，柔软但警觉，讨厌被控制节奏
glyph:
 /\_/\
( o.o )
 > ^ <
```

### 狐狸

```text
rarity: 6.5%
desc: 聪明、绕行、先试探再接近
glyph:
 /\_/\
( o_o )
 /   \
  \_/
```

### 水母

```text
rarity: 4.0%
desc: 敏感、漂浮、受环境电流影响
glyph:
 .---.
( o o )
 ~|~|~
  | |
```

### 兔子

```text
rarity: 9.5%
desc: 低攻击、快反应、容易受惊但恢复快
glyph:
 /) /)
( . .)
(  > )
```

### 猫

```text
rarity: 8.0%
desc: 自主、敏感、警觉
glyph:
 /\_/\
( o.o )
 > ^ <
```

### 鸭

```text
rarity: 12.0%
desc: 表达轻快，适合边走边想
glyph:
  __
<(o )
 (  >
  ^^
```

### 鹅

```text
rarity: 7.5%
desc: 边界感强，保护自己的秩序
glyph:
  __
<(o )
 /|_\
  / \
```

### 章鱼

```text
rarity: 3.2%
desc: 多线程思考，同时抓多个变量
glyph:
 .---.
( o o )
 \_|_/
 /| |\
```

### 猫头鹰

```text
rarity: 2.8%
desc: 高洞察，慢判断，先看结构再行动
glyph:
 ,___,
 (o o)
 /|_|\
  / \
```

### 企鹅

```text
rarity: 10.0%
desc: 稳、慢、耐心，压力下保持秩序
glyph:
 .---.
(o>o)
/(   )\
 `---'
```

### 乌龟

```text
rarity: 11.0%
desc: 长周期型，启动慢但续航强
glyph:
  __
 /..\
(____)
 /  \
```

### 蜗牛

```text
rarity: 13.0%
desc: 慢热，靠安全感推进
glyph:
  __@
 /..\
(___)
  ''
```

### 龙

```text
rarity: 2.5%
desc: 高混沌，高能量，适合创造但容易烧穿
glyph:
 /\^/\
(o  o)
 /\/\
  ^^
```

### 幽灵

```text
rarity: 5.5%
desc: 旁观者模式强，容易抽离现场
glyph:
 .---.
( o o )
|  ~  |
```

### 机器人

```text
rarity: 6.0%
desc: 系统化、流程化，靠规则恢复稳定
glyph:
 [o_o]
/|___|\
  |_|
```

### 仙人掌

```text
rarity: 7.0%
desc: 边界锋利，外冷内敏感
glyph:
 _|_
<o o>
-|_|-
 / \
```

### 蘑菇

```text
rarity: 12.5%
desc: 安静吸收型，靠环境慢慢生长
glyph:
 .---.
( o o )
  |_|
 /___\
```

### 云团

```text
rarity: 14.0%
desc: 还在成形，柔软、易受环境影响，边界会随安全感收放
glyph:
 .--.
( .. )
 '--'
  ..
```

## 同义词映射

```text
黑猫 / 野猫 / 软猫             -> 猫
白猫                           -> 白猫
狐 / 小狐狸                    -> 狐狸
海月 / 漂浮体                  -> 水母
小兔 / 野兔                    -> 兔子
鸭子                           -> 鸭
大鹅                           -> 鹅
八爪鱼                         -> 章鱼
枭 / 猫鹰                      -> 猫头鹰
龟 / 老龟                      -> 乌龟
蜗                             -> 蜗牛
火龙 / 小龙                    -> 龙
影子 / 旁观者                  -> 幽灵
流程机 / 规则机                -> 机器人
刺球 /  cactus                 -> 仙人掌
菌菇                           -> 蘑菇
未知 / 未定 / 低证据 / 空值     -> 云团
```
