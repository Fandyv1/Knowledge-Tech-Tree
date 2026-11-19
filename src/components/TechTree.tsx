import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import type { LearningGoal } from '../types';
import { getLayout, NODE_HEIGHT, NODE_WIDTH, type FlowNode } from '../lib/layout';
import { getHighlightSet } from '../lib/graph';
import { HighlightContext, type HighlightState } from './HighlightContext';
import KnowledgeNodeCard from './KnowledgeNodeCard';
import HoverCard, { type HoverTarget } from './HoverCard';

const HOVER_OPEN_DELAY = 250;
const HOVER_CLOSE_DELAY = 150;
const VIEWPORT_KEY_PREFIX = 'ktt:viewport:';

/** 触屏等无 hover 环境下跳过悬浮卡片，点击直接进详情 */
const supportsHover = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

const nodeTypes = { knowledge: KnowledgeNodeCard };

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
  const flow = useReactFlow<FlowNode, Edge>();
  const viewport = useViewport();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(focusNodeId);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [container, setContainer] = useState({ width: 0, height: 0 });

  // 需要自定义初始视口（focus 定位或恢复会话记忆）时，
  // 关闭库的 fitView，避免它在 effect 之后覆盖我们设置的视口。
  const [hasCustomViewport] = useState(() => {
    if (focusNodeId) return true;
    if (playEntrance) return false;
    return (
      window.sessionStorage.getItem(`${VIEWPORT_KEY_PREFIX}${goal.id}`) !== null
    );
  });

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
      highlightSet: hoveredId ? getHighlightSet(index, hoveredId) : new Set<string>(),
    }),
    [hoveredId, selectedId, index],
  );

  // 边的高亮：祖先链路上的边转主色，其余变淡。节点坐标不受影响。
  const styledEdges = useMemo<Edge[]>(() => {
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
      fitView: () => flow.fitView({ duration: 240, padding: 0.18 }),
      reset: () => {
        window.sessionStorage.removeItem(storageKey);
        flow.fitView({ duration: 240, padding: 0.18 });
      },
    });
  }, [flow, goal.id, onReady]);

  // 初始视口覆盖：focus 参数 > 会话记忆。
  // 默认的「适应画布」由 ReactFlow 的 fitView 属性处理。
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current || !hasCustomViewport) return;
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
          // focus 的 id 无效时回退到适应画布
          flow.fitView({ padding: 0.18 });
        }
        return;
      }

      // 从详情页返回时恢复之前的缩放与位置
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const viewport = JSON.parse(saved) as { x: number; y: number; zoom: number };
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
      flow.fitView({ padding: 0.18 });
    });

    return () => {
      window.cancelAnimationFrame(raf);
      // StrictMode 下 effect 会被双调用：cleanup 时同步重置守卫，
      // 否则第二次挂载会因守卫已置位而跳过，rAF 永远不执行。
      initialisedRef.current = false;
    };
  }, [flow, focusNodeId, goal.id, nodes, hasCustomViewport]);

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
      rect: {
        x: flowNode.position.x * zoom + offsetX,
        y: flowNode.position.y * zoom + offsetY,
        width: NODE_WIDTH * zoom,
        height: NODE_HEIGHT * zoom,
      },
    };
  }, [hoverNodeId, nodes, viewport]);

  return (
    <HighlightContext.Provider value={highlight}>
      <div
        ref={wrapperRef}
        className={`relative h-full w-full ${playEntrance ? 'tree-entering' : ''}`}
        onKeyDownCapture={onKeyDownCapture}
        onFocusCapture={onFocusCapture}
      >
        <ReactFlow<FlowNode, Edge>
          nodes={nodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          onMoveEnd={persistViewport}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable
          minZoom={0.3}
          maxZoom={1.6}
          fitView={!hasCustomViewport}
          fitViewOptions={{ padding: 0.18 }}
          zoomOnScroll
          panOnDrag
          panOnScroll={false}
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: '#94A3B8',
            },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="#CBD5E1"
          />
        </ReactFlow>

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
