import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { buildGraphIndex, type GraphIndex } from './graph';
import { BODY_SIZE, getBodyKind, hexToHue, type BodyKind } from './celestial';

/** 节点容器统一尺寸：取最大天体直径，外加标签占位高度 */
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 150;

/** 天体为圆形，需要比矩形布局更宽裕的间距，避免光晕互相侵占 */
const RANK_SEP = 132;
const NODE_SEP = 72;

export interface KnowledgeNodeData extends Record<string, unknown> {
  node: KnowledgeNode;
  category: Category;
  depth: number;
  kind: BodyKind;
  hue: number;
  successorCount: number;
}

export type FlowNode = Node<KnowledgeNodeData, 'knowledge'>;

export interface LayoutResult {
  nodes: FlowNode[];
  edges: Edge[];
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

function computeLayout(goal: LearningGoal): LayoutResult {
  const index = buildGraphIndex(goal);
  const categoryById = new Map(goal.categories.map((item) => [item.id, item]));

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: 72,
    marginy: 72,
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

  const nodes: FlowNode[] = ordered.map((node) => {
    const position = graph.node(node.id);
    const category = categoryById.get(node.category);
    if (!category) {
      throw new Error(`节点 ${node.id} 缺少类别定义：${node.category}`);
    }

    return {
      id: node.id,
      type: 'knowledge',
      position: {
        x: (position?.x ?? 0) - NODE_WIDTH / 2,
        y: (position?.y ?? 0) - NODE_HEIGHT / 2,
      },
      data: {
        node,
        category,
        depth: index.depth.get(node.id) ?? 0,
        kind: getBodyKind(index, node.id),
        hue: hexToHue(category.color),
        successorCount: (index.successors.get(node.id) ?? []).length,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false,
      connectable: false,
      selectable: true,
    };
  });

  const edges: Edge[] = [];
  for (const node of goal.nodes) {
    for (const prerequisite of index.prerequisites.get(node.id) ?? []) {
      edges.push({
        id: `${prerequisite}--${node.id}`,
        source: prerequisite,
        target: node.id,
        type: 'default',
        focusable: false,
      });
    }
  }

  return { nodes, edges, index };
}

export { BODY_SIZE };
