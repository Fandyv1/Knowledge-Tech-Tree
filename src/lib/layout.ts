import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { buildGraphIndex, type GraphIndex } from './graph';
import { STAR_RADIUS, getStarClass, type StarClass } from './starmap';

/** 节点容器：星点 + 下方两行标签 */
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 86;

/** 星点圆心到容器顶部的距离（与 CSS 中 .star-node__orb 高度对应） */
const ORB_HEIGHT = 54;
const STAR_CY = ORB_HEIGHT / 2;
const CENTER_OFFSET_Y = NODE_HEIGHT / 2 - STAR_CY;

/** 星点很小，间距按星图密度收紧；但仍给标签留出呼吸空间 */
const RANK_SEP = 106;
const NODE_SEP = 88;

/** 连线在星点外缘留出的空隙 */
const EDGE_GAP = 9;

export interface KnowledgeNodeData extends Record<string, unknown> {
  node: KnowledgeNode;
  category: Category;
  depth: number;
  starClass: StarClass;
  /** 星点视觉半径，供连线裁剪与选中环使用 */
  radius: number;
  /** 拓扑序号，形如 07，用于档案编号 */
  order: number;
  /** 由布局坐标虚构的赤经赤纬，纯装饰 */
  coord: string;
  successorCount: number;
}

export type FlowNode = Node<KnowledgeNodeData, 'knowledge'>;

export interface ConstellationEdgeData extends Record<string, unknown> {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type FlowEdge = Edge<ConstellationEdgeData>;

export interface LayoutResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
  index: GraphIndex;
}

const cache = new Map<string, LayoutResult>();

/** 按 goalId 缓存布局结果，整个会话只计算一次。 */
export function getLayout(goal: LearningGoal): LayoutResult {
  const cached = cache.get(goal.id);
  if (cached) return cached;

  const result = computeLayout(goal);
  cache.set(goal.id, result);
  return result;
}

/** 把画布坐标折算成虚构的赤经赤纬，为档案卡提供「星图坐标」 */
function toCoord(x: number, y: number, box: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const spanX = Math.max(1, box.maxX - box.minX);
  const spanY = Math.max(1, box.maxY - box.minY);
  const raHours = ((x - box.minX) / spanX) * 24;
  const dec = 45 - ((y - box.minY) / spanY) * 90;

  const h = Math.floor(raHours);
  const m = Math.round((raHours - h) * 60);
  const decSign = dec >= 0 ? '+' : '−';
  const decAbs = Math.abs(dec);

  return `RA ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m · DEC ${decSign}${decAbs
    .toFixed(0)
    .padStart(2, '0')}°`;
}

function computeLayout(goal: LearningGoal): LayoutResult {
  const index = buildGraphIndex(goal);
  const categoryById = new Map(goal.categories.map((item) => [item.id, item]));

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: 80,
    marginy: 80,
  });

  for (const node of goal.nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const node of goal.nodes) {
    for (const prerequisite of index.prerequisites.get(node.id) ?? []) {
      graph.setEdge(prerequisite, node.id);
    }
  }

  dagre.layout(graph);

  // 按层级排序，使 Tab 键遍历顺序与学习顺序一致
  const ordered = [...goal.nodes].sort((a, b) => {
    const depthDiff = (index.depth.get(a.id) ?? 0) - (index.depth.get(b.id) ?? 0);
    if (depthDiff !== 0) return depthDiff;
    return (graph.node(a.id)?.x ?? 0) - (graph.node(b.id)?.x ?? 0);
  });

  const boxes = ordered.map((node) => {
    const position = graph.node(node.id);
    return {
      x: position?.x ?? 0,
      y: position?.y ?? 0,
    };
  });
  const minX = Math.min(...boxes.map((box) => box.x));
  const maxX = Math.max(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxY = Math.max(...boxes.map((box) => box.y));

  // 星点圆心：容器中心上移，让标签落在星点正下方
  const centers = new Map<string, { cx: number; cy: number }>();
  ordered.forEach((node, i) => {
    centers.set(node.id, {
      cx: boxes[i].x,
      cy: boxes[i].y - CENTER_OFFSET_Y,
    });
  });

  const nodes: FlowNode[] = ordered.map((node, i) => {
    const box = boxes[i];
    const category = categoryById.get(node.category);
    if (!category) {
      throw new Error(`节点 ${node.id} 缺少类别定义：${node.category}`);
    }
    const starClass = getStarClass(index, node.id);

    return {
      id: node.id,
      type: 'knowledge',
      position: {
        x: box.x - NODE_WIDTH / 2,
        y: box.y - NODE_HEIGHT / 2,
      },
      data: {
        node,
        category,
        depth: index.depth.get(node.id) ?? 0,
        starClass,
        radius: STAR_RADIUS[starClass],
        order: i + 1,
        coord: toCoord(box.x, box.y, { minX, maxX, minY, maxY }),
        successorCount: (index.successors.get(node.id) ?? []).length,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false,
      connectable: false,
      selectable: true,
    };
  });

  const radiusById = new Map(
    nodes.map((item) => [item.id, item.data.radius] as const),
  );

  const edges: FlowEdge[] = [];
  for (const node of goal.nodes) {
    for (const prerequisite of index.prerequisites.get(node.id) ?? []) {
      const from = centers.get(prerequisite);
      const to = centers.get(node.id);
      if (!from || !to) continue;

      const sourceRadius = radiusById.get(prerequisite) ?? 8;
      const targetRadius = radiusById.get(node.id) ?? 8;

      const dx = to.cx - from.cx;
      const dy = to.cy - from.cy;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;

      edges.push({
        id: `${prerequisite}--${node.id}`,
        source: prerequisite,
        target: node.id,
        type: 'constellation',
        focusable: false,
        data: {
          x1: from.cx + ux * (sourceRadius + EDGE_GAP),
          y1: from.cy + uy * (sourceRadius + EDGE_GAP),
          x2: to.cx - ux * (targetRadius + EDGE_GAP),
          y2: to.cy - uy * (targetRadius + EDGE_GAP),
        },
      });
    }
  }

  return { nodes, edges, index };
}
