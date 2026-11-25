import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type NodeMouseHandler,
} from '@xyflow/react';
import type { LearningGoal } from '../types';
import {
  getLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
  type FlowEdge,
  type FlowNode,
} from '../lib/layout';
import { getHighlightSet } from '../lib/graph';
import { HighlightContext, type HighlightState } from './HighlightContext';
import KnowledgeNodeCard from './KnowledgeNodeCard';
import ConstellationEdge from './ConstellationEdge';
import HoverCard, { type HoverTarget } from './HoverCard';
import { StarLegend } from './CategoryLegend';

const HOVER_OPEN_DELAY = 250;
const HOVER_CLOSE_DELAY = 150;
const VIEWPORT_KEY_PREFIX = 'ktt:viewport:';

/** 触屏等无 hover 环境下跳过悬浮卡片，点击直接进详情 */
const supportsHover = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

const nodeTypes = { knowledge: KnowledgeNodeCard };
const edgeTypes = { constellation: ConstellationEdge };

export interface TechTreeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  reset: () => void;
}

interface TechTreeProps {
  goal: LearningGoal;
  /** 仅从首页搜索跳转时为 true，播放入场生长动画 */
  playEntrance: boolean;
  /** ?focus=nodeId，进入时定位并高亮 */
  focusNodeId: string | null;
  onOpenNode: (nodeId: string) => void;
  onReady: (handle: TechTreeHandle) => void;
}

export default function TechTree(props: TechTreeProps) {
  return (
    <ReactFlowProvider>
      <TechTreeInner {...props} />
    </ReactFlowProvider>
  );
}

function TechTreeInner({
  goal,
  playEntrance,
  focusNodeId,
  onOpenNode,
  onReady,
}: TechTreeProps) {
  const { nodes, edges, index } = useMemo(() => getLayout(goal), [goal]);
  const flow = useReactFlow<FlowNode, FlowEdge>();
  const viewport = useViewport();

  // 窄屏上「全局适配」会把 20 个节点压到 0.3 倍，标签不可读。
  // 因此窄屏改为「保底 0.52 + 顶部对齐」：先看清起点，再向下平移。
  const narrow = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 639px)').matches,
    [],
  );

  // 「适应画布」始终允许缩到全景；窄屏首屏的保底缩放由下方初始视口逻辑负责。
  const fitOptions = useMemo(
    () => ({ padding: 0.1, maxZoom: 1, minZoom: 0.25 }),
    [],
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(focusNodeId);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [container, setContainer] = useState({ width: 0, height: 0 });

  // 需要自定义初始视口（focus 定位或恢复会话记忆）时，
  // 关闭库的 fitView，避免它在 effect 之后覆盖我们设置的视口。
  const [hasSavedViewport] = useState(() => {
    if (focusNodeId) return true;
    if (playEntrance) return false;
    return (
      window.sessionStorage.getItem(`${VIEWPORT_KEY_PREFIX}${goal.id}`) !== null
    );
  });

  // 窄屏始终自行设置初始视口（顶部对齐 + 保底缩放）
  const useCustomViewport = hasSavedViewport || narrow;

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // 容器尺寸用于悬浮卡片的边界翻转
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainer({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const highlight = useMemo<HighlightState>(
    () => ({
      hoveredId,
      selectedId,
      highlightSet: hoveredId
        ? getHighlightSet(index, hoveredId)
        : new Set<string>(),
    }),
    [hoveredId, selectedId, index],
  );

  // 边的高亮：祖先链路上的边转黄铜金，其余变淡。节点坐标不受影响。
  const styledEdges = useMemo<FlowEdge[]>(() => {
    if (!hoveredId) return edges;

    const set = highlight.highlightSet;
    return edges.map((edge) => ({
      ...edge,
      className:
        set.has(edge.source) && set.has(edge.target)
          ? 'ktt-edge-active'
          : 'ktt-edge-faded',
    }));
  }, [edges, hoveredId, highlight.highlightSet]);

  const scheduleOpen = useCallback(
    (nodeId: string, immediate = false) => {
      clearTimers();
      if (immediate) {
        setHoverNodeId(nodeId);
        return;
      }
      openTimer.current = window.setTimeout(() => {
        setHoverNodeId(nodeId);
      }, HOVER_OPEN_DELAY);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = window.setTimeout(() => {
      setHoverNodeId(null);
      setHoveredId(null);
    }, HOVER_CLOSE_DELAY);
  }, []);

  const onNodeMouseEnter = useCallback<NodeMouseHandler<FlowNode>>(
    (_, node) => {
      // 触屏环境不弹卡片，避免与滚动手势冲突
      if (!supportsHover()) return;
      setHoveredId(node.id);
      scheduleOpen(node.id);
    },
    [scheduleOpen],
  );

  const onNodeMouseLeave = useCallback(() => scheduleClose(), [scheduleClose]);

  const onNodeClick = useCallback<NodeMouseHandler<FlowNode>>(
    (_, node) => {
      setSelectedId(node.id);
      onOpenNode(node.id);
    },
    [onOpenNode],
  );

  // 键盘可达：focus 立即显示卡片，Enter / Space 进详情
  const onKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        clearTimers();
        setHoverNodeId(null);
        setHoveredId(null);
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const element = (event.target as HTMLElement)?.closest('.react-flow__node');
      const nodeId = element?.getAttribute('data-id');
      if (!nodeId) return;
      event.preventDefault();
      setSelectedId(nodeId);
      onOpenNode(nodeId);
    },
    [clearTimers, onOpenNode],
  );

  const onFocusCapture = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const element = (event.target as HTMLElement)?.closest('.react-flow__node');
      const nodeId = element?.getAttribute('data-id');
      if (!nodeId) return;
      setHoveredId(nodeId);
      scheduleOpen(nodeId, true);
    },
    [scheduleOpen],
  );

  // 控制按钮与视口恢复
  useEffect(() => {
    const storageKey = `${VIEWPORT_KEY_PREFIX}${goal.id}`;

    onReady({
      zoomIn: () => flow.zoomIn({ duration: 180 }),
      zoomOut: () => flow.zoomOut({ duration: 180 }),
      fitView: () => flow.fitView({ duration: 240, ...fitOptions }),
      reset: () => {
        window.sessionStorage.removeItem(storageKey);
        flow.fitView({ duration: 240, ...fitOptions });
      },
    });
  }, [flow, goal.id, onReady, fitOptions]);

  // 初始视口覆盖：focus 参数 > 会话记忆。
  // 默认的「适应画布」由 ReactFlow 的 fitView 属性处理。
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current || !useCustomViewport) return;
    initialisedRef.current = true;

    const storageKey = `${VIEWPORT_KEY_PREFIX}${goal.id}`;

    // 等一帧，确保 React Flow 完成容器测量后再设置视口
    const raf = window.requestAnimationFrame(() => {
      if (focusNodeId) {
        const target = nodes.find((node) => node.id === focusNodeId);
        if (target) {
          flow.setCenter(
            target.position.x + NODE_WIDTH / 2,
            target.position.y + NODE_HEIGHT / 2,
            { zoom: 1.1, duration: 420 },
          );
        } else {
          flow.fitView(fitOptions);
        }
        return;
      }

      // 从详情页返回时恢复之前的缩放与位置
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const viewport = JSON.parse(saved) as {
            x: number;
            y: number;
            zoom: number;
          };
          if (
            Number.isFinite(viewport.x) &&
            Number.isFinite(viewport.y) &&
            Number.isFinite(viewport.zoom)
          ) {
            flow.setViewport(viewport);
            return;
          }
        } catch {
          // 数据损坏则清除，走下方兜底
        }
        window.sessionStorage.removeItem(storageKey);
      }

      if (narrow) {
        // 顶部对齐：让主星从画布上沿开始，而不是被居中裁掉
        const width = wrapperRef.current?.clientWidth ?? 0;
        const xs = nodes.map((node) => node.position.x);
        const ys = nodes.map((node) => node.position.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const graphWidth = Math.max(...xs) + NODE_WIDTH - minX;
        const zoom = Math.max(
          0.52,
          Math.min(1, (width - 24) / Math.max(graphWidth, 1)),
        );
        flow.setViewport({
          // 左对齐：优先露出学习路径的起点列，其余靠平移浏览
          x: 12 - minX * zoom,
          y: 16 - minY * zoom,
          zoom,
        });
        return;
      }

      flow.fitView(fitOptions);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      // StrictMode 下 effect 会被双调用：cleanup 时同步重置守卫，
      // 否则第二次挂载会因守卫已置位而跳过，rAF 永远不执行。
      initialisedRef.current = false;
    };
  }, [flow, focusNodeId, goal.id, nodes, useCustomViewport, narrow, fitOptions]);

  const persistViewport = useCallback(() => {
    const viewport = flow.getViewport();
    window.sessionStorage.setItem(
      `${VIEWPORT_KEY_PREFIX}${goal.id}`,
      JSON.stringify(viewport),
    );
  }, [flow, goal.id]);

  const hoverTarget = useMemo<HoverTarget | null>(() => {
    if (!hoverNodeId) return null;
    const flowNode = nodes.find((node) => node.id === hoverNodeId);
    if (!flowNode) return null;

    const { x: offsetX, y: offsetY, zoom } = viewport;
    return {
      node: flowNode.data.node,
      category: flowNode.data.category,
      starClass: flowNode.data.starClass,
      order: flowNode.data.order,
      coord: flowNode.data.coord,
      rect: {
        x: flowNode.position.x * zoom + offsetX,
        y: flowNode.position.y * zoom + offsetY,
        width: NODE_WIDTH * zoom,
        height: NODE_HEIGHT * zoom,
      },
    };
  }, [hoverNodeId, nodes, viewport]);

  const zoomLabel = viewport.zoom.toFixed(2);

  return (
    <HighlightContext.Provider value={highlight}>
      <div
        ref={wrapperRef}
        className={`relative h-full w-full overflow-hidden ${
          playEntrance ? 'tree-entering' : ''
        }`}
        onKeyDownCapture={onKeyDownCapture}
        onFocusCapture={onFocusCapture}
      >
        {/* 星云与漂移星尘层，置于画布之下 */}
        <div className="canvas-nebula" aria-hidden="true" />
        <div className="starfield" aria-hidden="true" />

        {/* 缩小时放大标签字号，保证远观仍可读 */}
        <style>{`
          .react-flow__viewport { --label-scale: ${Math.min(1.9, Math.max(1, 0.86 / Math.max(viewport.zoom, 0.2)))}; }
        `}</style>

        <ReactFlow<FlowNode, FlowEdge>
          nodes={nodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          onMoveEnd={persistViewport}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable
          minZoom={0.25}
          maxZoom={1.8}
          fitView={!useCustomViewport}
          fitViewOptions={fitOptions}
          zoomOnScroll
          panOnDrag
          panOnScroll={false}
          proOptions={{ hideAttribution: false }}
          style={{ background: 'transparent' }}
        />

        {/* 画布 HUD：图号、比例、刻度、星等图例 */}
        <div className="hud left-4 top-3 hidden sm:block sm:left-6 sm:top-4">
          <p className="micro">FIG. 02 — CONSTELLATION MAP</p>
          <p className="mt-1 font-serif text-[12px] tracking-[0.14em] text-paper-300">
            知识点依赖星图
          </p>
        </div>

        <div className="hud right-4 top-3 text-right sm:right-6 sm:top-4">
          <p className="micro">SCALE</p>
          <p className="mono mt-1 text-[11px] tracking-[0.16em] text-paper-300">
            ×{zoomLabel}
          </p>
        </div>

        <div className="hud bottom-8 left-4 hidden sm:block">
          <div className="flex items-end gap-2">
            <div className="ruler-x w-24 opacity-60" aria-hidden="true" />
            <span className="micro pb-0.5">1 UNIT</span>
          </div>
        </div>

        <div className="hud bottom-7 right-3 max-w-[calc(100%-1.5rem)] sm:right-6">
          <StarLegend />
        </div>

        <div
          className="hud bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
          aria-hidden="true"
        >
          <span className="micro">
            {String(nodes.length).padStart(2, '0')} STARS ·{' '}
            {String(edges.length).padStart(2, '0')} LINKS
          </span>
        </div>

        {hoverTarget && (
          <div className="pointer-events-none absolute inset-0">
            <HoverCard
              target={hoverTarget}
              container={container}
              onEnter={clearTimers}
              onLeave={scheduleClose}
              onOpen={() => onOpenNode(hoverTarget.node.id)}
            />
          </div>
        )}
      </div>
    </HighlightContext.Provider>
  );
}
