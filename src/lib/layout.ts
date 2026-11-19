import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { buildGraphIndex, type GraphIndex } from './graph';

/** 节点尺寸与 CSS 保持同源，布局不依赖 DOM 测量，避免首帧抖动。 */
export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 68;

const RANK_SEP = 96;
const NODE_SEP = 48;

export interface KnowledgeNodeData extends Record<string, unknown> {
  node: KnowledgeNode;
  category: Category;
  depth: number;
  isRoot: boolean;
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
    marginx: 32,
    marginy: 32,
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
        isRoot: (index.prerequisites.get(node.id) ?? []).length === 0,
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
        type: 'smoothstep',
        focusable: false,
      });
    }
  }

  return { nodes, edges, index };
}
