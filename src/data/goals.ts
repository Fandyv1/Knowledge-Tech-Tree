import type { Category, KnowledgeNode, LearningGoal } from '../types';
import { validateGoals } from '../lib/validate';
import { foundationNodes } from './nodes/foundation';
import { machineLearningNodes } from './nodes/machine-learning';
import { llmArchitectureNodes } from './nodes/llm-architecture';
import { llmApplicationNodes } from './nodes/llm-application';
import { engineeringNodes } from './nodes/engineering';

const aiLlmCategories: Category[] = [
  // 星图色板：黄铜金 / 冷青 / 灰绿 / 雾紫 / 玫瑰 / 赤陶，统一降饱和
  { id: 'math', name: '数学基础', color: '#C9A96A', colorSoft: 'rgba(201, 169, 106, 0.14)' },
  { id: 'programming', name: '编程与工具', color: '#82B0C0', colorSoft: 'rgba(130, 176, 192, 0.14)' },
  { id: 'ml', name: '机器学习', color: '#8FBFA0', colorSoft: 'rgba(143, 191, 160, 0.14)' },
  { id: 'llm-core', name: '大模型核心', color: '#A98BD0', colorSoft: 'rgba(169, 139, 208, 0.15)' },
  { id: 'engineering', name: '工程化', color: '#CE8FA6', colorSoft: 'rgba(206, 143, 166, 0.14)' },
  { id: 'practice', name: '实践与评测', color: '#D19468', colorSoft: 'rgba(209, 148, 104, 0.14)' },
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
