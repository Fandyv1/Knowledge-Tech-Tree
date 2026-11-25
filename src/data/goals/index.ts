import type { KnowledgeNode, LearningGoal } from '../../types';
import { validateGoals } from '../../lib/validate';
import aiLlm from './ai-llm.json';
import pythonData from './python-data.json';
import mathExam from './math-exam.json';

/**
 * 节点数据全部存放在同级 JSON 中：
 * - ai-llm.json       AI 大模型（24 节点 / 8 类别）
 * - python-data.json  Python 数据分析（24 节点 / 5 类别）
 * - math-exam.json    考研数学（24 节点 / 5 类别）
 *
 * JSON 在构建期被 Vite 直接 import，仍然是纯静态站点，不产生额外请求。
 */
export const goals = [
  aiLlm,
  pythonData,
  mathExam,
] as unknown as LearningGoal[];

/** 开发期数据自检：类别引用、id 唯一、依赖存在、图无环。生产构建会被移除。 */
if (import.meta.env.DEV) {
  validateGoals(goals);
}

export const findGoalById = (goalId: string | undefined): LearningGoal | null =>
  goals.find((goal) => goal.id === goalId) ?? null;

export const findNodeById = (
  goal: LearningGoal,
  nodeId: string | undefined,
): KnowledgeNode | null => goal.nodes.find((node) => node.id === nodeId) ?? null;
