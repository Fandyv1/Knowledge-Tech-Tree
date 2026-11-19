import type { KnowledgeNode, LearningGoal } from '../types';

export interface GraphIndex {
  /** nodeId → 节点 */
  byId: Map<string, KnowledgeNode>;
  /** nodeId → 直接前置 id */
  prerequisites: Map<string, string[]>;
  /** nodeId → 直接后继 id */
  successors: Map<string, string[]>;
  /** nodeId → 全部祖先（间接前置）id 集合 */
  ancestors: Map<string, Set<string>>;
  /** nodeId → 拓扑层级（最长路径深度，起点为 0） */
  depth: Map<string, number>;
  /** 最大层级 */
  maxDepth: number;
  /** 依赖边总数 */
  edgeCount: number;
}

/** 一次性构建图索引，供布局、高亮、动画延迟等多处复用。 */
export function buildGraphIndex(goal: LearningGoal): GraphIndex {
  const byId = new Map(goal.nodes.map((node) => [node.id, node]));

  const prerequisites = new Map<string, string[]>();
  const successors = new Map<string, string[]>();
  for (const node of goal.nodes) {
    successors.set(node.id, []);
  }
  let edgeCount = 0;
  for (const node of goal.nodes) {
    const valid = node.prerequisites.filter((id) => byId.has(id));
    prerequisites.set(node.id, valid);
    edgeCount += valid.length;
    for (const prerequisite of valid) {
      successors.get(prerequisite)?.push(node.id);
    }
  }

  const depth = computeDepth(goal.nodes, prerequisites);
  const maxDepth = Math.max(0, ...depth.values());

  const ancestors = new Map<string, Set<string>>();
  for (const node of goal.nodes) {
    ancestors.set(node.id, collectAncestors(node.id, prerequisites));
  }

  return { byId, prerequisites, successors, ancestors, depth, maxDepth, edgeCount };
}

/**
 * 拓扑层级 = 到任一起点的最长路径长度。
 * 用最长路径而非 BFS 最短距离，保证节点永远排在其全部前置之后。
 */
function computeDepth(
  nodes: KnowledgeNode[],
  prerequisites: Map<string, string[]>,
): Map<string, number> {
  const depth = new Map<string, number>();
  const resolving = new Set<string>();

  const resolve = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    // 数据层已保证无环，这里只做防御，避免异常数据导致栈溢出
    if (resolving.has(id)) return 0;

    resolving.add(id);
    const parents = prerequisites.get(id) ?? [];
    const value =
      parents.length === 0 ? 0 : Math.max(...parents.map((parent) => resolve(parent) + 1));
    resolving.delete(id);
    depth.set(id, value);
    return value;
  };

  for (const node of nodes) resolve(node.id);
  return depth;
}

/** 反向 BFS 收集全部祖先。 */
function collectAncestors(
  nodeId: string,
  prerequisites: Map<string, string[]>,
): Set<string> {
  const result = new Set<string>();
  const queue = [...(prerequisites.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (result.has(current)) continue;
    result.add(current);
    queue.push(...(prerequisites.get(current) ?? []));
  }

  return result;
}

/** 悬停高亮用：节点自身 + 全部祖先。 */
export function getHighlightSet(index: GraphIndex, nodeId: string): Set<string> {
  const ancestors = index.ancestors.get(nodeId);
  const result = new Set<string>(ancestors ? [...ancestors] : []);
  result.add(nodeId);
  return result;
}

/** 详情页推荐：以当前节点为前置的第一个后继节点。 */
export function getNextSuggestion(
  index: GraphIndex,
  nodeId: string,
): KnowledgeNode | null {
  const successors = index.successors.get(nodeId) ?? [];
  const sorted = [...successors].sort(
    (a, b) => (index.depth.get(a) ?? 0) - (index.depth.get(b) ?? 0),
  );
  const first = sorted[0];
  return first ? (index.byId.get(first) ?? null) : null;
}

/** 按类别统计节点数，供图例展示。 */
export function countByCategory(goal: LearningGoal): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of goal.nodes) {
    counts.set(node.category, (counts.get(node.category) ?? 0) + 1);
  }
  return counts;
}
