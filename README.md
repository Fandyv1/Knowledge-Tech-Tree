# Knowledge-Tech-Tree（知识科技树）

Help people who want to learn knowledge better understand what they should study.

帮助希望学习知识的人更清楚地了解自己应该学什么。

输入「想学什么」，网页分析后渲染出一张可交互的知识点科技树：缩放平移浏览、悬停看简介、点击进详情、从详情跳转知乎搜索。

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
| 自动布局 | @dagrejs/dagre（原 `dagre` 已停止维护，官方 fork，API 兼容） |
| 样式 | Tailwind CSS 3.4 + 少量原生 CSS（承载动画与类别动态配色） |
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

类型定义见 `src/types.ts`。数据位于 `src/data/goals.ts`，按领域拆分到 `src/data/nodes/*.ts` 便于维护。

内置的 **AI 大模型** 目标包含 **20 个知识点、27 条依赖关系、6 个类别、8 层依赖结构**。

`src/lib/validate.ts` 在开发期（`import.meta.env.DEV`）自动校验三件事，失败即抛错，错误会直接出现在控制台：

1. 节点 id 全局唯一
2. 所有 `prerequisites` 引用的 id 都存在
3. 依赖图无环（DFS 三色标记，报错时打印环路径如 `a → b → c → a`）

生产构建会把这段校验 tree-shake 掉。

### 如何新增一个学习目标

1. 在 `src/data/nodes/` 下新建节点数据文件，按 `KnowledgeNode` 接口填写。每个节点需要：
   - `summary`（≤50 字，悬浮卡片「这是什么」）
   - `why`（≤40 字，悬浮卡片「为什么学」）
   - `description`（2–4 段，详情页概述）
   - `purposes`（3–6 条）、`resources`（2–5 条）、`zhihuKeywords`（1–3 个）
   - `prerequisites`（前置节点 id，空数组表示起点）
2. 在 `src/data/goals.ts` 中组装一个 `LearningGoal`，填好 `id`（将成为路由参数）、`title`、`subtitle`、`categories`。
3. 把该 goal 加入导出的 `goals` 数组。

**完成即生效** —— 搜索匹配、布局、图例、分析步骤文案全部由数据驱动，无需改动任何组件。`aliases` 里写上用户可能的说法即可被搜到。

### 如何替换为真实后端 / LLM

当前架构的单向依赖是 `data → lib → components → pages`，替换只需动最底两层：

- **换匹配逻辑**：把 `matchGoal` 改为调用后端语义检索接口。由于它是纯函数且只在状态机一处被调用，改成异步时只需在 `useAnalysisMachine` 的 `SUBMIT` 分支加 `await`。
- **换数据来源**：把 `goals.ts` 的静态导出改为异步加载（fetch / React Query），并在加载态渲染骨架屏。`types.ts` 的接口即为前后端数据契约。
- **换分析过程**：`analyzeSteps.ts` 目前返回固定步骤，可改为订阅后端的流式进度事件（SSE），`AnalysisProgress` 组件的 props 接口无需变化。

UI 组件层完全不需要改动。

---

## 交互细节

### 科技树页

### 视觉风格：暗色星系

整体采用大面积暗色背景（`#05060F`）叠加紫色径向光晕与毛玻璃质感，配色提取自设计参考图（色相集中在 250–272°，强调色 `#7C3AED` / `#A855F7`）。

科技树以**天体**隐喻呈现知识层级，映射规则见 `src/lib/celestial.ts`：

| 天体 | 判定条件 | 直径 | 视觉特征 |
| --- | --- | --- | --- |
| 恒星 | 无前置依赖（起点） | 120px | 金色球体 + 呼吸光冕 |
| 行星 | 有前置且有后继（枢纽） | 76px | 类别色球体 + 光晕 + 倾斜轨道环 |
| 卫星 | 无后继（终点） | 50px | 低饱和岩石质感小球 |

当前数据下为 **4 恒星 + 11 行星 + 5 卫星**。球体用径向渐变制造受光面，发光由多层 `box-shadow` 叠加；为保证画布缩放流畅，光晕采用多段渐变而非 `filter: blur()`。

节点类名（`body-star` / `body-planet` / `body-moon`）由 JS 按天体类型拼接，因此这三条 CSS 规则**必须置于 `@layer` 之外**，否则会被 Tailwind 静态扫描判定为未使用而摇树删除。

标签使用绝对定位脱离布局流，并按 `--label-scale` 随画布缩放反向补偿字号，保证全局俯视时仍可读。

- **布局**：dagre `rankdir: 'TB'`，水平间距 72px、垂直 132px（圆形天体需比矩形更宽裕的间距，避免光晕互相侵占）。节点容器固定 150×150，布局不依赖 DOM 测量，避免首帧抖动。结果按 `goalId` 缓存，整个会话只计算一次。
- **缩放平移**：滚轮缩放（0.3–1.6）、拖拽平移、双指手势可用。**节点拖拽已禁用**，保持自动布局一致性。
- **悬停联动**：悬停节点时，该节点及其全部直接/间接前置节点高亮，连线转主色，其余元素降到 `opacity: 0.35`。祖先集合在构建图索引时预先算好存入 `Map`，hover 时是 O(1) 查表。
- **性能取舍**：高亮状态通过 `HighlightContext` 下发给自定义节点组件，使 `nodes` 数组引用保持稳定，避免每次 hover 触发 React Flow 的全量节点 diff。只有 edges 需要换 `className`，而边变化不影响节点坐标，无重排风险。
- **Tab 顺序**：节点数组按拓扑层级排序后渲染，键盘遍历顺序与学习顺序一致，而非 DOM 随机序。
- **视口记忆**：`onMoveEnd` 时把视口写入 `sessionStorage`，从详情页返回时恢复之前的缩放与位置。

### 悬浮卡片

- 悬停停留 **250ms** 弹出，移出 **150ms** 后关闭；卡片自身可 hover 并会取消关闭计时器，形成「节点 → 卡片」的移动宽限。
- 全局只有**一个**浮层组件，由 `{ nodeId, anchorRect }` 状态驱动，不是每个节点各渲染一个。
- 定位优先在节点上方，上方空间不足时翻到下方；水平方向钳制在容器内，保证靠近视口边缘时卡片依然完整可见。随画布缩放平移跟随节点。
- 键盘：节点可 Tab 聚焦，`focus` 时立即显示卡片（无 250ms 延迟），`Enter` / `Space` 进详情，`Esc` 关闭。

### 移动端 hover 降级

无 hover 环境（`pointer: coarse`）下，悬浮卡片的交互语义变为：

- **点击节点直接进入详情页**，不经过悬浮卡片。原因是触屏上「长按出卡片、再点卡片进详情」是两段式操作，比直接进详情更慢，且容易与页面滚动手势冲突。
- 节点卡片上的 `summary` 与 `why` 在详情页顶部均有呈现（副标题 + 「用途」块开头），信息不丢失。
- 画布满宽显示，顶部控制按钮缩为图标，搜索框满宽。

如果产品上确实需要移动端也有卡片预览，可在 `TechTree.tsx` 中监听 `onNodeClick`：首次点击 `setHoverNodeId` 展示卡片，再次点击同一节点才导航。

---

## 响应式与可访问性

- ≥1024px 为完整布局；移动端画布满宽、控制按钮缩为图标、搜索框满宽。
- 所有交互态（hover / focus / active）过渡 150–200ms。
- 完整支持 `prefers-reduced-motion`：分析动画压缩到 900ms，入场动画 stagger 从 110ms 降到 24ms，连线绘制动画关闭。
- 全局键盘可达：`Tab` 遍历 → `Enter` 触发 → `Esc` 关闭悬浮卡片。可完成「聚焦节点 → 看卡片 → 进详情 → 点知乎」全链路。
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
│   ├── goals.ts                  LearningGoal[] 组装 + 开发期校验
│   └── nodes/                    按领域拆分的节点数据
│       ├── foundation.ts         数学与编程基础（4）
│       ├── machine-learning.ts   机器学习与框架（3）
│       ├── llm-architecture.ts   架构与预训练（4）
│       ├── llm-application.ts    对齐与应用（5）
│       └── engineering.ts        工程化与实践（4）
├── lib/                          纯函数层，不 import React
│   ├── matchGoal.ts              归一化 + 打分匹配
│   ├── analyzeSteps.ts           步骤文案 + 时长序列
│   ├── layout.ts                 dagre 布局 + 结果缓存
│   ├── graph.ts                  前置/后继/祖先集合/拓扑分层
│   ├── celestial.ts              天体层级映射（恒星/行星/卫星）+ 色相换算
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
│   ├── TechTree.tsx              ReactFlow 容器 + 交互编排
│   ├── KnowledgeNodeCard.tsx     自定义节点
│   ├── HighlightContext.ts       高亮状态下发
│   ├── HoverCard.tsx             单一浮层
│   ├── CategoryLegend.tsx        图例 + 分类计数
│   └── NotFound.tsx              404
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

- 知识库只内置 **AI 大模型** 一个目标。输入其他内容会走「未命中 → 引导到示例目标」分支，**不会为其他方向伪造科技树数据**。
- 节点的 `resources` 外链指向官方文档、经典课程与 arXiv 论文等稳定来源，但第三方链接的长期可用性不在本项目控制范围内。
- React Flow 画布右下角保留官方归属水印（`hideAttribution` 按其许可条款仅供订阅用户使用）。
- 未实现：浅色主题切换（当前仅暗色星系主题）、节点拖拽位置持久化、多目标切换、「已学会」进度标记。

## License

[Apache License 2.0](LICENSE)
