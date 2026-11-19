import type { LearningGoal } from '../types';
import { buildGraphIndex } from './graph';

export interface AnalysisStep {
  id: string;
  title: string;
  detail: string;
}

export const ANALYSIS_STEP_COUNT = 5;

/**
 * 生成分析步骤文案。
 * 第 1 步回显用户原始输入与识别到的关键词，其余步骤的数字全部由 goal 数据实时计算，
 * 保证界面上的「N 个知识点 / M 条依赖关系」与真实数据一致。
 */
export function buildAnalysisSteps(
  goal: LearningGoal,
  rawInput: string,
): AnalysisStep[] {
  const index = buildGraphIndex(goal);
  const nodeCount = goal.nodes.length;
  const edgeCount = index.edgeCount;
  const categoryCount = goal.categories.length;
  const layerCount = index.maxDepth + 1;
  const resourceCount = goal.nodes.reduce(
    (total, node) => total + node.resources.length,
    0,
  );
  const zhihuCount = goal.nodes.reduce(
    (total, node) => total + node.zhihuKeywords.length,
    0,
  );
  const topCategories = goal.categories
    .slice(0, 3)
    .map((category) => category.name)
    .join('、');

  const trimmedInput = rawInput.trim();

  return [
    {
      id: 'parse',
      title: '解析学习目标',
      detail: `从「${trimmedInput}」识别关键词：${goal.searchHints.join('、')}`,
    },
    {
      id: 'domains',
      title: '拆解知识领域',
      detail: `覆盖${topCategories}等 ${categoryCount} 个领域`,
    },
    {
      id: 'dependencies',
      title: '识别前置依赖',
      detail: `梳理 ${nodeCount} 个知识点、${edgeCount} 条依赖关系`,
    },
    {
      id: 'resources',
      title: '匹配学习素材',
      detail: `匹配 ${resourceCount} 份课程、论文与文档，${zhihuCount} 个知乎讨论入口`,
    },
    {
      id: 'layout',
      title: '布局科技树',
      detail: `自动分层布局中，共 ${layerCount} 层依赖结构…`,
    },
  ];
}

const MIN_STEP = 400;
const MAX_STEP = 700;
const MIN_TOTAL = 2500;
const MAX_TOTAL = 3500;
const REDUCED_TOTAL = 900;

/**
 * 生成每步时长：先在 400–700ms 间随机，再整体缩放到 2.5–3.5s 的目标总时长，
 * 兼顾随机感与「总时长可控」这两个约束。
 */
export function buildStepDurations(reducedMotion: boolean): number[] {
  if (reducedMotion) {
    return Array.from(
      { length: ANALYSIS_STEP_COUNT },
      () => REDUCED_TOTAL / ANALYSIS_STEP_COUNT,
    );
  }

  const raw = Array.from(
    { length: ANALYSIS_STEP_COUNT },
    () => MIN_STEP + Math.random() * (MAX_STEP - MIN_STEP),
  );
  const rawTotal = raw.reduce((sum, value) => sum + value, 0);
  const target = MIN_TOTAL + Math.random() * (MAX_TOTAL - MIN_TOTAL);
  const scale = target / rawTotal;

  return raw.map((value) => Math.round(value * scale));
}
