import type { Edge, Node } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { buildGraphIndex, type GraphIndex } from './graph';
import { STAR_RADIUS, getStarClass, type StarClass } from './starmap';

/** 节点容器：只包住星点，标签绝对定位在下方（不参与命中与布局） */
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 60;

const ORB_HEIGHT = 54;
const STAR_CY = ORB_HEIGHT / 2;

/** 径向布局常数：从中心罗盘向外的同心轨道 */
const R0 = 114;
const R_STEP = 74;
/** 每个类别扇形的可用张角比例，留出扇区间空隙 */
const SECTOR_FILL = 0.72;
/** 同一轨道上两个节点标签之间的最小弧长 */
const LABEL_GAP = 146;
/** 中心罗盘的半径，扇形射线从这里开始 */
export const CORE_R = 46;

export interface RadialSector {
  id: string;
  name: string;
  color: string;
  count: number;
  start: number;
  end: number;
  mid: number;
}

export interface RadialMeta {
  r0: number;
  step: number;
  maxRing: number;
  maxRadius: number;
  rings: number[];
  sectors: RadialSector[];
}

export interface KnowledgeNodeData extends Record<string, unknown> {
  node: KnowledgeNode;
  category: Category;
  depth: number;
  starClass: StarClass;
  radius: number;
  ring: number;
  angle: number;
  order: number;
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
  radial: RadialMeta;
}

const cache = new Map<string, LayoutResult>();

export function getLayout(goal: LearningGoal): LayoutResult {
  const cached = cache.get(goal.id);
  if (cached) return cached;

  const result = computeLayout(goal);
  cache.set(goal.id, result);
  return result;
}

/**
 * 类别排布：把相关性高的类别放在相邻扇形，减少跨扇区连线。
 * 类别数 ≤ 7 时穷举全排列（最多 5040 种），按「跨类别连线的环形距离」打分取最优。
 */
function orderCategories(goal: LearningGoal): Category[] {
  const categories = goal.categories;
  if (categories.length <= 1) return categories;

  const categoryOf = new Map(goal.nodes.map((node) => [node.id, node.category]));
  const counts = new Map<string, Map<string, number>>();
  for (const node of goal.nodes) {
    for (const prerequisite of node.prerequisites) {
      const from = categoryOf.get(prerequisite);
      const to = node.category;
      if (!from || from === to) continue;
      const row = counts.get(from) ?? new Map<string, number>();
      row.set(to, (row.get(to) ?? 0) + 1);
      counts.set(from, row);
    }
  }

  const ids = categories.map((category) => category.id);
  // 8 个类别时全排列为 8! = 40320，仍然可以在首屏算完；更多类别退回声明顺序
  if (ids.length > 8) return categories;

  const costOf = (order: string[]): number => {
    const position = new Map(order.map((id, i) => [id, i]));
    let cost = 0;
    for (const [from, row] of counts) {
      const a = position.get(from);
      if (a === undefined) continue;
      for (const [to, weight] of row) {
        const b = position.get(to);
        if (b === undefined) continue;
        const distance = Math.abs(a - b);
        cost += weight * Math.min(distance, order.length - distance);
      }
    }
    return cost;
  };

  let best: string[] = [...ids];
  let bestCost = costOf(ids);
  const used = new Array(ids.length).fill(false);
  const current: string[] = [];

  const walk = () => {
    if (current.length === ids.length) {
      const cost = costOf(current);
      if (cost < bestCost) {
        bestCost = cost;
        best = [...current];
      }
      return;
    }
    for (let i = 0; i < ids.length; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      current.push(ids[i]);
      walk();
      current.pop();
      used[i] = false;
    }
  };
  walk();

  // 让「数学基础」从正上方开始，学习动线顺时针展开
  const startIndex = best.includes('math') ? best.indexOf('math') : 0;
  const rotated = [...best.slice(startIndex), ...best.slice(0, startIndex)];

  return rotated
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category));
}

interface Placement {
  cx: number;
  cy: number;
  angle: number;
  radius: number;
  ring: number;
  minAngle: number;
  maxAngle: number;
}

function computeLayout(goal: LearningGoal): LayoutResult {
  const index = buildGraphIndex(goal);
  const categoryById = new Map(goal.categories.map((item) => [item.id, item]));
  const orderedCategories = orderCategories(goal);

  const nodesByCategory = new Map<string, KnowledgeNode[]>();
  for (const node of goal.nodes) {
    const list = nodesByCategory.get(node.category) ?? [];
    list.push(node);
    nodesByCategory.set(node.category, list);
  }

  // 扇形角度：按类别节点数开平方加权，避免大类吃掉整个圆
  const weights = orderedCategories.map((category) =>
    Math.sqrt(nodesByCategory.get(category.id)?.length ?? 1),
  );
  const weightTotal = weights.reduce((sum, value) => sum + value, 0) || 1;

  const sectors: RadialSector[] = [];
  let cursor = -Math.PI / 2;
  orderedCategories.forEach((category, i) => {
    const span = (weights[i] / weightTotal) * Math.PI * 2;
    sectors.push({
      id: category.id,
      name: category.name,
      color: category.color,
      count: nodesByCategory.get(category.id)?.length ?? 0,
      start: cursor,
      end: cursor + span,
      mid: cursor + span / 2,
    });
    cursor += span;
  });

  const placements = new Map<string, Placement>();

  /** 父节点平均角度：用于同轨道排序，减少连线交叉 */
  const parentHint = (node: KnowledgeNode): number => {
    const parents = index.prerequisites.get(node.id) ?? [];
    if (parents.length === 0) return Number.NaN;
    let sum = 0;
    let count = 0;
    for (const parentId of parents) {
      const placement = placements.get(parentId);
      if (!placement) continue;
      sum += placement.angle;
      count += 1;
    }
    return count === 0 ? Number.NaN : sum / count;
  };

  for (const sector of sectors) {
    const items = [...(nodesByCategory.get(sector.id) ?? [])].sort((a, b) => {
      const depthDiff = (index.depth.get(a.id) ?? 0) - (index.depth.get(b.id) ?? 0);
      if (depthDiff !== 0) return depthDiff;
      const succDiff =
        (index.successors.get(b.id) ?? []).length -
        (index.successors.get(a.id) ?? []).length;
      if (succDiff !== 0) return succDiff;
      return a.id.localeCompare(b.id);
    });

    const byDepth = new Map<number, KnowledgeNode[]>();
    for (const node of items) {
      const depth = index.depth.get(node.id) ?? 0;
      const list = byDepth.get(depth) ?? [];
      list.push(node);
      byDepth.set(depth, list);
    }

    const usable = (sector.end - sector.start) * SECTOR_FILL;
    let ring = 0;

    for (const depth of [...byDepth.keys()].sort((a, b) => a - b)) {
      ring = Math.max(ring, depth);
      const list = [...(byDepth.get(depth) ?? [])];
      list.sort((a, b) => {
        const ha = parentHint(a);
        const hb = parentHint(b);
        if (Number.isNaN(ha) && Number.isNaN(hb)) return 0;
        if (Number.isNaN(ha)) return 1;
        if (Number.isNaN(hb)) return -1;
        return ha - hb;
      });

      let placed = 0;
      while (placed < list.length) {
        const radius = R0 + ring * R_STEP;
        const capacity = Math.max(1, Math.floor((radius * usable) / LABEL_GAP));
        const take = Math.min(capacity, list.length - placed);

        // 单节点轨道在扇形内左右交错，形成星座状的折线，而不是一条直线
        const PHASES = [0, 0.33, -0.33, 0.17, -0.17];
        const phase =
          usable * PHASES[ring % PHASES.length] * (take === 1 ? 1 : 0.22);
        const base = sector.mid - usable / 2 + phase;

        for (let slot = 0; slot < take; slot += 1) {
          const node = list[placed + slot];
          const fraction = take === 1 ? 0.5 : slot / (take - 1);
          const raw = base + fraction * usable;
          const angle = Math.min(
            sector.end - 0.03,
            Math.max(sector.start + 0.03, raw),
          );
          placements.set(node.id, {
            cx: Math.cos(angle) * radius,
            cy: Math.sin(angle) * radius,
            angle,
            radius,
            ring,
            minAngle: sector.start + 0.03,
            maxAngle: sector.end - 0.03,
          });
        }

        placed += take;
        ring += 1;
      }
    }
  }

  // 标签盒子固定 150×36，挂在星点下方 45px。
  // 角度容量只能保证同轨不撞，跨轨仍可能重叠，这里用迭代微调角度做二次消解。
  const LABEL_WIDTH = 150;
  const LABEL_HEIGHT = 36;
  const LABEL_OFFSET_Y = 45;
  const placedList = [...placements.values()];

  for (let iter = 0; iter < 240; iter += 1) {
    let moved = false;

    for (let i = 0; i < placedList.length; i += 1) {
      for (let j = i + 1; j < placedList.length; j += 1) {
        const a = placedList[i];
        const b = placedList[j];
        const overlapX = LABEL_WIDTH - Math.abs(a.cx - b.cx);
        const overlapY =
          LABEL_HEIGHT - Math.abs(
            a.cy + LABEL_OFFSET_Y - (b.cy + LABEL_OFFSET_Y),
          );
        if (overlapX <= 0 || overlapY <= 0) continue;

        moved = true;
        const lower = a.angle <= b.angle ? a : b;
        const upper = lower === a ? b : a;
        const step = Math.min(0.05, 0.004 + overlapX / 8000);
        const before = lower.angle + upper.angle;
        lower.angle = Math.max(lower.minAngle, lower.angle - step);
        upper.angle = Math.min(upper.maxAngle, upper.angle + step);

        if (lower.angle + upper.angle === before && overlapY > 2) {
          // 两边都贴到扇区边界时，仍然向外推一格，避免死锁
          const target = a.radius >= b.radius ? a : b;
          target.radius += 6;
          target.ring = Math.round((target.radius - R0) / R_STEP);
        }

        for (const item of [lower, upper]) {
          item.cx = Math.cos(item.angle) * item.radius;
          item.cy = Math.sin(item.angle) * item.radius;
        }
      }
    }

    if (!moved) break;
  }

  const maxRadius = Math.max(
    R0,
    ...[...placements.values()].map((placement) => placement.radius),
  );
  const maxRing = Math.max(
    0,
    ...goal.nodes.map((node) => placements.get(node.id)?.ring ?? 0),
  );

  // 按「深度 → 角度」排序，Tab 顺序与学习顺序一致
  const ordered = [...goal.nodes].sort((a, b) => {
    const depthDiff = (index.depth.get(a.id) ?? 0) - (index.depth.get(b.id) ?? 0);
    if (depthDiff !== 0) return depthDiff;
    return (placements.get(a.id)?.angle ?? 0) - (placements.get(b.id)?.angle ?? 0);
  });

  const coordOf = (radius: number, angle: number): string => {
    const normalized =
      ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const raHours = (normalized / (Math.PI * 2)) * 24;
    const h = Math.floor(raHours);
    const m = Math.round((raHours - h) * 60);
    const dec = Math.round((radius / Math.max(maxRadius, 1)) * 80);
    return `RA ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m · DEC +${String(dec).padStart(2, '0')}°`;
  };

  const nodes: FlowNode[] = ordered.map((node, i) => {
    const category = categoryById.get(node.category);
    if (!category) {
      throw new Error(`节点 ${node.id} 缺少类别定义：${node.category}`);
    }
    const starClass = getStarClass(index, node.id);
    const placement = placements.get(node.id) ?? {
      cx: 0,
      cy: 0,
      angle: 0,
      radius: R0,
      ring: 0,
    };

    return {
      id: node.id,
      type: 'knowledge',
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      position: {
        x: placement.cx - NODE_WIDTH / 2,
        y: placement.cy - STAR_CY,
      },
      data: {
        node,
        category,
        depth: index.depth.get(node.id) ?? 0,
        starClass,
        radius: STAR_RADIUS[starClass],
        ring: placement.ring,
        angle: placement.angle,
        order: i + 1,
        coord: coordOf(placement.radius, placement.angle),
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
    nodes.map((node) => [node.id, node.data.radius] as const),
  );
  const centerById = new Map(
    nodes.map((node) => {
      const placement = placements.get(node.id);
      return [node.id, { cx: placement?.cx ?? 0, cy: placement?.cy ?? 0 }] as const;
    }),
  );

  const edges: FlowEdge[] = [];
  for (const node of goal.nodes) {
    for (const prerequisite of node.prerequisites) {
      const from = centerById.get(prerequisite);
      const to = centerById.get(node.id);
      if (!from || !to) continue;

      const sourceRadius = radiusById.get(prerequisite) ?? 8;
      const targetRadius = radiusById.get(node.id) ?? 8;
      const dx = to.cx - from.cx;
      const dy = to.cy - from.cy;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;
      const gap = 9;

      edges.push({
        id: `${prerequisite}--${node.id}`,
        source: prerequisite,
        target: node.id,
        type: 'constellation',
        focusable: false,
        data: {
          x1: from.cx + ux * (sourceRadius + gap),
          y1: from.cy + uy * (sourceRadius + gap),
          x2: to.cx - ux * (targetRadius + gap),
          y2: to.cy - uy * (targetRadius + gap),
        },
      });
    }
  }

  const rings = Array.from({ length: maxRing + 1 }, (_, i) => R0 + i * R_STEP);

  return {
    nodes,
    edges,
    index,
    radial: {
      r0: R0,
      step: R_STEP,
      maxRing,
      maxRadius,
      rings,
      sectors,
    },
  };
}
