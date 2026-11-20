import type { GraphIndex } from './graph';

export type BodyKind = 'star' | 'planet' | 'moon';

/**
 * 把知识图谱映射为天体层级：
 *   恒星 star   —— 无前置的起点，是整条学习链路的能量来源
 *   行星 planet —— 有前置、且仍有后继的枢纽节点
 *   卫星 moon   —— 终点节点，依附于前序知识而存在
 */
export function getBodyKind(index: GraphIndex, nodeId: string): BodyKind {
  const prerequisites = index.prerequisites.get(nodeId) ?? [];
  const successors = index.successors.get(nodeId) ?? [];

  if (prerequisites.length === 0) return 'star';
  if (successors.length === 0) return 'moon';
  return 'planet';
}

/** 每种天体的直径（px），与 CSS 中 --body-* 保持同源 */
export const BODY_SIZE: Record<BodyKind, number> = {
  star: 116,
  planet: 92,
  moon: 76,
};

/** 天体中文名，用于详情页与图例说明 */
export const BODY_LABEL: Record<BodyKind, string> = {
  star: '恒星',
  planet: '行星',
  moon: '卫星',
};

/** 天体定位说明，解释它在学习路径中的角色 */
export const BODY_DESC: Record<BodyKind, string> = {
  star: '起点 · 无需前置知识',
  planet: '枢纽 · 承上启下',
  moon: '终点 · 当前分支的落点',
};

/** 把类别主色转为 HSL 色相，供球体渐变使用 */
export function hexToHue(hex: string): number {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 258;

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}
