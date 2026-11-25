# Knowledge-Tech-Tree（知识科技树）

Help people who want to learn knowledge better understand what they should study.

帮助希望学习知识的人更清楚地了解自己应该学什么。

输入「想学什么」，网页分析后渲染出一张可交互的知识点星图：缩放平移浏览、悬停看档案、点击进详情、从详情跳转知乎搜索。

内置三张星图：**AI 大模型**、**Python 数据分析**、**考研数学**，各 24 个知识点。

> **演示版本说明**：所谓「分析」是**纯前端本地模拟** —— 对输入做归一化与关键词打分匹配，命中内置知识库后播放一段分步骤进度动画，文案中的数字由数据实时计算。**全程不调用任何大模型或后端 API。**

---

## 快速开始

```bash
npm install
npm run dev     # 开发服务器，默认 http://localhost:5173
```

其他命令：

```bash
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览生产构建产物
npm test          # 运行单元测试（Vitest）
```

环境要求：Node.js 18+。

---

## 技术栈

| 关注点 | 选型 |
| --- | --- |
| 框架 | React 18 + TypeScript 5 + Vite |
| 路由 | react-router-dom（BrowserRouter） |
| 图可视化 | @xyflow/react（React Flow v13） |
| 排布 | 自研「类别扇形 × 同心轨道」径向布局（思路参考 [math-tree](https://github.com/wizarot/math-tree)） |
| 样式 | Tailwind CSS 3.4 + 少量原生 CSS（承载动画与类别动态配色） |
| 数据 | `src/data/goals/*.json`，构建期 import，无后端请求 |
| 测试 | Vitest |

数据全部静态内置，无后端、无数据库、无 LLM 调用。

---

## 路由说明

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 搜索态 + 分析态同页切换，不改变路由 |
| `/tree/:goalId` | 科技树 | 支持 `?focus=nodeId` 定位并高亮指定节点 |
| `/tree/:goalId/node/:nodeId` | 知识点详情 | 概述、用途、素材、知乎讨论四块 |
| `*` | 404 | 友好提示 + 返回首页，不白屏 |

**直接刷新深层路由可用**：刷新 `/tree/ai-llm` 会直接展示完整科技树，不重放入场动画。

入场动画只在「从首页提交搜索」后播放一次，通过 `navigate(..., { state: { fromSearch: true } })` 传递标记；`TreePage` 读取后立即用 `replace` 清除该 state，因此刷新与浏览器后退都不会重复播放。

---

## 「分析」是怎么实现的

这是本项目最需要诚实说明的部分。相关实现集中在三个文件：

### 1. `src/lib/matchGoal.ts` —— 输入匹配

纯函数，无副作用，可单独测试。

`normalize(input)` 做四步：去首尾空格 → 全角转半角 → 转小写 → 去掉空格与标点。

`matchGoal(input, goals)` 按下表打分，取最高分，**阈值 40 分**，低于阈值返回 `null`：

| 条件 | 分值 |
| --- | --- |
| 输入 === `goal.title`（归一化后） | 100 |
| 输入 === 某个 alias | 90 |
| 输入**包含**某个 alias（如「我想学大模型」含「大模型」） | 60 |
| 某个 alias **包含**输入（如输入「大模」） | 40 |
| 与 `searchHints` 有 ≥2 个词重叠 | +20 |

别名匹配刻意放得较宽松，是为了降低演示门槛。**真实产品应把这一层替换为后端语义检索或向量召回。**

### 2. `src/lib/analyzeSteps.ts` —— 步骤文案与时长

`buildAnalysisSteps(goal, rawInput)` 生成 5 步文案。除第 1 步回显用户输入外，**所有数字都从 `goal` 实时计算**，数据改了文案自动跟着变：

- 知识点数 = `goal.nodes.length`
- 依赖边数 = 所有节点 `prerequisites` 长度之和
- 领域数 = `goal.categories.length`
- 层数 = 拓扑最大深度 + 1
- 素材数、知乎入口数同理累加

`buildStepDurations(reducedMotion)` 先在 400–700ms 间随机取 5 个值，再整体缩放到 2.5–3.5s 的目标总时长，兼顾随机感与可控性。`prefers-reduced-motion` 下压缩到 900ms 内完成。

### 3. `src/hooks/useAnalysisMachine.ts` —— 首页状态机

四个相位的判别联合：

```
idle ──SUBMIT(空)──▶ idle（shakeToken++ 触发抖动）
idle ──SUBMIT(未命中)──▶ noMatch（展示引导卡片）
idle ──SUBMIT(命中)──▶ analyzing(step 0)
analyzing ──TICK×4──▶ analyzing(step 4) ──TICK──▶ leaving
analyzing ──SKIP──▶ leaving
leaving ──(effect)──▶ navigate('/tree/:id', { state: { fromSearch: true } })
```

两个设计要点：

- **空输入抖动不是独立相位**，只是 `idle` 上的一次性视觉事件，用自增的 `shakeToken` 作为 CSS 动画元素的 `key` 触发重播，避免污染状态机。
- **`leaving` 中间相位**让「自然结束」与「跳过动画」汇聚到同一出口，导航副作用只在一处 effect 触发，不会重复跳转。

步骤推进的 timer 由单个 effect 持有并在 cleanup 中清理，跳过、卸载、快速连点都不会产生野 timer。

---

## 数据模型与校验

类型定义见 `src/types.ts`；节点数据统一放在 `src/data/goals/*.json`，由 `src/data/goals/index.ts` 在**构建期 import**。仍然是纯静态站点，不产生额外请求。

| 文件 | 目标 | 规模 |
| --- | --- | --- |
| `ai-llm.json` | AI 大模型 | 24 节点 / 8 类别 / 36 条依赖 |
| `python-data.json` | Python 数据分析 | 24 节点 / 5 类别 / 33 条依赖 |
| `math-exam.json` | 考研数学 | 24 节点 / 5 类别 / 38 条依赖 |

每个 JSON 就是一个完整的 `LearningGoal`：`id`、`title`、`subtitle`、`aliases`、`searchHints`、`categories`、`nodes`。节点内部只存 `prerequisites: string[]`，后继、祖先、深度、边数都由 `buildGraphIndex` 在运行时派生，不存在单独的 edges 文件。

`src/lib/validate.ts` 在开发期（`import.meta.env.DEV`）自动校验，失败即抛错，错误直接出现在控制台：

1. 学习目标 id、类别 id、节点 id 唯一
2. 节点的 `category` 必须在 `categories` 中声明
3. 所有 `prerequisites` 引用的 id 都存在
4. 素材 `type` 只能是 article / video / course / book / doc / paper
5. 依赖图无环（DFS 三色标记，报错时打印环路径如 `a → b → c → a`）

生产构建会把这段校验 tree-shake 掉。

### 如何新增知识点

1. 打开对应 `src/data/goals/<goal>.json`，在 `nodes` 末尾追加一个对象：
   - `summary`（≤50 字，档案卡「这是什么」）
   - `why`（≤40 字，档案卡「为什么学」）
   - `description`（2–4 段，详情页概述）
   - `purposes`（3–6 条）、`resources`（2–5 条）、`zhihuKeywords`（1–3 个）
   - `prerequisites`（前置节点 id，空数组表示起点）
2. `category` 必须能在同文件的 `categories` 里找到；需要新类别时，在 `categories` 里补 `id / name / color / colorSoft`。
3. 保存即生效：搜索匹配、径向布局、图例计数、分析步骤文案全部由数据驱动。

### 如何新增一个学习目标

1. 新建 `src/data/goals/<id>.json`，结构照抄任意现有文件，替换 `id`、标题、别名、类别与节点。
2. 在 `src/data/goals/index.ts` 里 import 该 JSON，并加入 `goals` 数组。
3. `aliases` 写全用户可能的说法（例如「数据分析」「pandas」「考研数一」），首页示例 chips 会自动展示所有目标标题。

**切换目标**：首页搜索目标标题/别名，或直接访问 `/tree/<goalId>`，例如 `/tree/python-data`、`/tree/math-exam`。

### 如何替换为真实后端 / LLM

当前架构的单向依赖是 `data → lib → components → pages`，替换只需动最底两层：

- **换匹配逻辑**：把 `matchGoal` 改为调用后端语义检索接口。由于它是纯函数且只在状态机一处被调用，改成异步时只需在 `useAnalysisMachine` 的 `SUBMIT` 分支加 `await`。
- **换数据来源**：把 `src/data/goals/index.ts` 里的 JSON import 改为异步加载（fetch / React Query），并在加载态渲染骨架屏。`types.ts` 的接口即为前后端数据契约。
- **换分析过程**：`analyzeSteps.ts` 目前返回固定步骤，可改为订阅后端的流式进度事件（SSE），`AnalysisProgress` 组件的 props 接口无需变化。

UI 组件层完全不需要改动。

---

## 交互细节

### 视觉风格：星图暗场

- **底色**：近黑 `#04050A`，叠加极淡星云、暗角与胶片颗粒（`body::before` 星尘 / `body::after` 星云）。
- **线条**：纸白 `rgba(239,234,222,.07–.34)` 的发丝线，负责所有分隔、边框与链路。
- **强调**：黄铜金 `#C9A96A`，只用于当前路径、关键动作与档案编号。
- **字体**：标题用系统衬线栈（思源宋体 → Songti SC → SimSun），坐标/编号用等宽字体，正文用系统无衬线。
- **装饰**：`.frame` 双线边框、`.corners` 对角角标、`.ruler-x` / `.ruler-y` 刻度尺、`.rule-diamond` 菱形分隔线。

工具类集中在 `src/index.css`（`.display` / `.micro` / `.micro-strong` / `.mono` / `.btn` / `.chip` / `.field` / `.star-node`）。星点、链路与 HUD 依赖 `data-lit` / `data-dim` / `data-selected` 属性选择器与 CSS 变量组合，因此**统一写在 `@layer` 之外**，避免被 Tailwind 静态扫描判为未使用而摇树删除。

### 知识点的星等体系

`src/lib/starmap.ts` 把图结构映射为三档星等，图例、节点与详情页共用同一份定义：

| 星等 | 判定条件 | 视觉半径 | 形态 |
| --- | --- | --- | --- |
| 主星 anchor | 无前置依赖（起点） | 12px | 最大四芒星 + 光晕 |
| 中继星 relay | 有前置且有后继（枢纽） | 8.5px | 中等四芒星 |
| 末端星 terminal | 无后继（终点） | 6px | 小四芒星 |

主星 / 中继星 / 末端星由依赖关系自动判定（三张图合计 **72 个节点**）。四芒星由单条 SVG 路径绘制（尖点 ±50、弧边内凹），光晕是径向渐变层而非 `filter: blur()`，全图同时缩放仍然流畅。星点颜色取自类别色；高亮时叠加 `drop-shadow`，未命中时整体降到 0.3 透明度。

窄屏下星点的元数据行（类别 · MAG）会隐藏，避免远景糊成一团。

### 星座链路

`src/components/ConstellationEdge.tsx` 是自定义边：

- 起止坐标在 `layout.ts` 里按星点半径裁剪（`radius + 9px`），线恰好停在星点外缘，不依赖 React Flow 的 handle 位置。
- 每条边三层：4px 低透明度光晕、1px 发丝线、两端 1.1 / 1.7px 圆点；`vector-effect: non-scaling-stroke` 让细线在任何缩放下都保持 1px。
- 悬停时祖先链的边转黄铜金（`ktt-edge-active`），其余降到 0.28 透明度（`ktt-edge-faded`）。
- 连线为直线，不做曲线避让——这是星图的几何语言，交叉本身构成星座纹理。

### 排布逻辑：类别扇形 × 同心轨道

排布思路参考 [wizarot/math-tree](https://github.com/wizarot/math-tree) 的径向星图：中心是原点，类别是扇形射线，越靠外代表依赖越深。

1. **类别排序**：把每个目标的 5–8 个类别看成一个环，穷举全排列（≤8 类时最多 40320 种），按「跨类别连线的环形距离」打分，把交互最多的类别放在相邻扇形，减少横穿圆心的长线。存在「数学基础」类别时从正上方开始顺时针展开。
2. **扇形宽度**：按类别节点数开平方加权，避免 9 个节点的大类吃掉整个圆；每个扇形的可用张角再乘 0.72，留出扇区之间的呼吸位。
3. **半径 = 依赖深度**：节点按深度分层，半径 `R0 + ring × 60`；同一深度组内按半径递增，保证依赖始终向外。
4. **轨道容量**：每条轨道能放几个节点由弧长 ÷ 标签宽度决定，放不下就溢出到下一圈；只有 1 个节点的轨道在扇形内左右交错，形成星座折线，避免标签排成一条直线。
5. **同轨排序**：按父节点的平均角度排序，让子节点尽量靠近自己的前置，减少交叉。
6. **标签优先**：节点容器缩到 150×60，标签绝对定位在星点下方，不参与命中与布局；取景时显式把标签溢出和外围轨道算进包围盒，保证不裁切。
7. **中心罗盘**：`CorePlate` 用渐隐黑底盖住汇聚到原点的连线，压上黄铜双环、十字准星与四芒星；底层 `RadialGuides` 画同心轨道、扇区光带与虚线中轴。

### 科技树页

- **布局**：径向排布，节点容器固定 150×60，星点圆心距容器顶部 27px，标签绝对定位在下方。布局是纯函数、不依赖 DOM 测量，结果按 `goalId` 缓存，整个会话只计算一次。
- **缩放平移**：滚轮缩放（0.25–1.8）、拖拽平移、双指手势可用。**节点拖拽已禁用**，保持自动布局一致性。
- **悬停联动**：悬停节点的全部直接/间接前置与自身高亮，连线转金，其余元素降到 0.3 透明度。祖先集合在构建图索引时预先算好存入 `Map`，hover 时是 O(1) 查表。
- **性能取舍**：高亮状态通过 `HighlightContext` 下发给自定义节点组件，使 `nodes` 数组引用保持稳定，避免每次 hover 触发 React Flow 的全量节点 diff。只有 edges 需要换 `className`，而边变化不影响节点坐标，无重排风险。
- **画布 HUD**：左上图号/图名、右上实时缩放倍率、左下刻度尺、右下星等图例、底部星数与链路数，全部 `pointer-events-none`。
- **Tab 顺序**：节点数组按拓扑层级排序后渲染，键盘遍历顺序与学习顺序一致，而非 DOM 随机序。
- **视口记忆**：`onMoveEnd` 时把视口写入 `sessionStorage`，从详情页返回时恢复之前的缩放与位置。
- **窄屏初始视口**：以罗盘原点为中心、0.6 倍局部视图，先看清内核与前三圈，外侧靠平移浏览；点击「适应画布」可看全景（标签会很小）。

### 星座档案卡（悬浮卡片）

- 悬停停留 **250ms** 弹出，移出 **150ms** 后关闭；卡片自身可 hover 并会取消关闭计时器，形成「节点 → 卡片」的移动宽限。
- 全局只有**一个**浮层组件，由 `{ nodeId, anchorRect }` 状态驱动，不是每个节点各渲染一个。
- 内容按档案格式组织：`ARCHIVE K-01` 编号、`MAG I · 主星` 星等、类别、标题、摘要、「为什么学」、由布局坐标折算的赤经赤纬，以及「进入档案」。
- 定位优先在节点上方，上方空间不足时翻到下方；水平方向钳制在容器内，保证靠近视口边缘时卡片依然完整可见。随画布缩放平移跟随节点。
- 键盘：节点可 Tab 聚焦，`focus` 时立即显示卡片（无 250ms 延迟），`Enter` / `Space` 进详情，`Esc` 关闭。

### 移动端 hover 降级

无 hover 环境（`pointer: coarse`）下，悬浮卡片的交互语义变为：

- **点击星点直接进入详情页**，不经过档案卡。原因是触屏上「长按出卡片、再点卡片进详情」是两段式操作，比直接进详情更慢，且容易与页面滚动手势冲突。
- 节点上的 `summary` 与 `why` 在详情页顶部均有呈现（副标题 + 「用途」块开头），信息不丢失。
- 画布满宽显示，顶部控制按钮保留方形图标，搜索框满宽。

如果产品上确实需要移动端也有卡片预览，可在 `TechTree.tsx` 中监听 `onNodeClick`：首次点击 `setHoverNodeId` 展示卡片，再次点击同一节点才导航。

---

## 响应式与可访问性

- ≥1024px 为完整布局；移动端画布满宽、控制按钮缩为图标、搜索框满宽，图例自动换行。
- 所有交互态（hover / focus / active）过渡 150–240ms。
- 完整支持 `prefers-reduced-motion`：分析动画压缩到 900ms，入场动画 stagger 从 90ms 降到 20ms，连线淡入关闭，星尘漂移停止。
- 全局键盘可达：`Tab` 遍历 → `Enter` 触发 → `Esc` 关闭档案卡。可完成「聚焦星点 → 看档案 → 进详情 → 点知乎」全链路。
- 焦点可见样式统一由 `:focus-visible` 提供。

---

## 静态部署

本项目使用 `BrowserRouter`，深层路由（如 `/tree/ai-llm/node/rag`）在静态托管上刷新会 404，**必须配置 history fallback**，把所有未匹配请求重写到 `index.html`。

仓库已包含两份现成配置：

- `public/_redirects` —— Netlify / Cloudflare Pages 自动识别
- `vercel.json` —— Vercel

其他平台：

**Nginx**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Caddy**

```
try_files {path} /index.html
```

**GitHub Pages** 不支持 rewrite，需把 `index.html` 复制为 `404.html`：

```bash
npm run build && cp dist/index.html dist/404.html
```

若部署在子路径下，还需在 `vite.config.ts` 设置 `base`，并给 `BrowserRouter` 传 `basename`。

---

## 项目结构

```
src/
├── types.ts                      数据契约
├── data/
│   └── goals/                    每张星图一个 JSON
│       ├── ai-llm.json           AI 大模型（24 节点 / 8 类别）
│       ├── python-data.json      Python 数据分析（24 节点 / 5 类别）
│       ├── math-exam.json        考研数学（24 节点 / 5 类别）
│       └── index.ts              构建期 import + 开发期校验 + 查找函数
├── lib/                          纯函数层，不 import React
│   ├── matchGoal.ts              归一化 + 打分匹配
│   ├── analyzeSteps.ts           步骤文案 + 时长序列
│   ├── layout.ts                 径向排布：类别扇形 + 轨道容量 + 结果缓存
│   ├── graph.ts                  前置/后继/祖先集合/拓扑分层
│   ├── starmap.ts                星等映射（主星/中继星/末端星）+ 图例文案
│   ├── validate.ts               唯一性 / 引用完整性 / 环检测
│   ├── zhihu.ts                  知乎搜索 URL
│   ├── matchGoal.test.ts         打分规则测试
│   └── graph.test.ts             图算法与数据校验测试
├── hooks/
│   ├── useAnalysisMachine.ts     首页状态机
│   └── useReducedMotion.ts       动画降级
├── components/
│   ├── SearchBox.tsx             输入 + 示例 chips + 抖动
│   ├── AnalysisProgress.tsx      5 步进度 + 进度条 + 跳过
│   ├── NoMatchHint.tsx           未命中引导卡片
│   ├── TechTree.tsx              ReactFlow 容器 + 交互编排 + HUD
│   ├── KnowledgeNodeCard.tsx     星点节点（SVG 四芒星 + 标签）
│   ├── ConstellationEdge.tsx     星座链路（裁剪端点 + 圆点）
│   ├── RadialGuides.tsx          同心轨道 / 扇区光带 / 中心罗盘
│   ├── HighlightContext.ts       高亮状态下发
│   ├── HoverCard.tsx             星座档案卡（单一浮层）
│   ├── CategoryLegend.tsx        分类图例 + 星等图例
│   └── NotFound.tsx              404（SIGNAL LOST）
└── pages/
    ├── HomePage.tsx              搜索态 + 分析态
    ├── TreePage.tsx
    └── NodeDetailPage.tsx
```

---

## 关于知乎

本站**不抓取、不代理、不内嵌**任何知乎内容。详情页的知乎按钮仅做关键词到搜索 URL 的拼接，在新标签页打开：

```ts
export const zhihuSearchUrl = (kw: string) =>
  `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(kw)}`;
```

所有外链均带 `target="_blank"` 与 `rel="noopener noreferrer"`。

---

## 已知边界

- 知识库内置 **AI 大模型 / Python 数据分析 / 考研数学** 三个目标。输入其他内容会走「未命中 → 引导到示例目标」分支，**不会为其他方向伪造科技树数据**。
- 节点数据在构建期打进 bundle，改 JSON 后需要重新构建；如需部署后热改数据，要改成运行时 fetch。
- 节点的 `resources` 外链指向官方文档、经典课程与 arXiv 论文等稳定来源，但第三方链接的长期可用性不在本项目控制范围内。
- React Flow 画布右下角保留官方归属水印（`hideAttribution` 按其许可条款仅供订阅用户使用）。
- 径向排布以类别分扇形，跨类别的长依赖仍是直线弦，会从圆盘中部穿过（中心罗盘已做遮挡）；节点数更多的目标需要重新评估轨道容量。
- 窄屏首屏采用以罗盘为中心的局部视图，四周星点需要平移浏览；点击「适应画布」可看全景，但此时标签会很小。
- 未实现：浅色主题切换（当前仅星图暗场主题）、节点拖拽位置持久化、画布内的目标切换器（目前靠首页搜索或直接访问 `/tree/<goalId>`）、「已学会」进度标记。

## License

[Apache License 2.0](LICENSE)
