import type { GraphIndex } from './graph';

/**
 * 星等体系：把知识图谱映射成同一片星座里的三类星。
 *   anchor   主星   —— 无前置的起点，整条学习链路的锚
 *   relay    中继星 —— 有前置、且仍有后继的枢纽
 *   terminal 末端星 —— 终点节点，当前分支的落点
 */
export type StarClass = 'anchor' | 'relay' | 'terminal';

export function getStarClass(index: GraphIndex, nodeId: string): StarClass {
  const prerequisites = index.prerequisites.get(nodeId) ?? [];
  const successors = index.successors.get(nodeId) ?? [];

  if (prerequisites.length === 0) return 'anchor';
  if (successors.length === 0) return 'terminal';
  return 'relay';
}

/** 星点视觉半径（px），决定 SVG 尺寸与连线留白 */
export const STAR_RADIUS: Record<StarClass, number> = {
  anchor: 12,
  relay: 8.5,
  terminal: 6,
};

/** 星等的中文名，用于档案与图例 */
export const STAR_LABEL: Record<StarClass, string> = {
  anchor: '主星',
  relay: '中继星',
  terminal: '末端星',
};

/** 拉丁文星等，作为装饰性副标题 */
export const STAR_LATIN: Record<StarClass, string> = {
  anchor: 'MAG I',
  relay: 'MAG II',
  terminal: 'MAG III',
};

/** 星等在路径中的角色说明 */
export const STAR_DESC: Record<StarClass, string> = {
  anchor: '起点 · 无需前置知识',
  relay: '枢纽 · 承上启下',
  terminal: '终点 · 当前分支的落点',
};
