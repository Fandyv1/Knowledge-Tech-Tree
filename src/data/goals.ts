import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { validateGoals } from '../lib/validate';
import { foundationNodes } from './nodes/foundation';
import { machineLearningNodes } from './nodes/machine-learning';
import { llmArchitectureNodes } from './nodes/llm-architecture';
import { llmApplicationNodes } from './nodes/llm-application';
import { engineeringNodes } from './nodes/engineering';

const aiLlmCategories: Category[] = [
  { id: 'math', name: '数学基础', color: '#6366F1', colorSoft: '#EEEFFE' },
  { id: 'programming', name: '编程与工具', color: '#0EA5E9', colorSoft: '#E6F5FD' },
  { id: 'ml', name: '机器学习', color: '#10B981', colorSoft: '#E4F8F0' },
  { id: 'llm-core', name: '大模型核心', color: '#F59E0B', colorSoft: '#FEF3E2' },
  { id: 'engineering', name: '工程化', color: '#7C3AED', colorSoft: '#F1EBFE' },
  { id: 'practice', name: '实践与评测', color: '#EF4444', colorSoft: '#FDEBEB' },
];

const aiLlmNodes: KnowledgeNode[] = [
  ...foundationNodes,
  ...machineLearningNodes,
  ...llmArchitectureNodes,
  ...llmApplicationNodes,
  ...engineeringNodes,
];

export const aiLlmGoal: LearningGoal = {
  id: 'ai-llm',
  title: 'AI 大模型',
  subtitle: '从数学与编程基础出发，一路走到预训练、对齐、RAG 与服务化部署',
  aliases: [
    'ai大模型',
    '大模型',
    'llm',
    '大语言模型',
    'ai',
    '人工智能',
    '机器学习',
    '深度学习',
    'gpt',
    'transformer',
    '模型',
    'largelanguagemodel',
    'large-language-model',
    '生成式ai',
    'aigc',
    '神经网络',
    'chatgpt',
    '语言模型',
  ],
  searchHints: ['AI', '大模型', 'LLM'],
  categories: aiLlmCategories,
  nodes: aiLlmNodes,
};

export const goals: LearningGoal[] = [aiLlmGoal];

/** 开发期数据自检：id 唯一、依赖存在、图无环。生产构建会被移除。 */
if (import.meta.env.DEV) {
  validateGoals(goals);
}

export const findGoalById = (goalId: string | undefined): LearningGoal | null =>
  goals.find((goal) => goal.id === goalId) ?? null;

export const findNodeById = (
  goal: LearningGoal,
  nodeId: string | undefined,
): KnowledgeNode | null => goal.nodes.find((node) => node.id === nodeId) ?? null;
