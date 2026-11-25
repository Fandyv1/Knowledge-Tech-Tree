/**
 * 类别 id 由各学习目标的 JSON 自行声明（如 math、multimodal、py-basics）。
 * 这里放宽为 string，由运行时校验保证节点引用的类别一定存在。
 */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  colorSoft: string;
}

export type ResourceType =
  | 'article'
  | 'video'
  | 'course'
  | 'book'
  | 'doc'
  | 'paper';

export interface Resource {
  title: string;
  type: ResourceType;
  url: string;
  note?: string;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  category: CategoryId;
  /** 悬浮卡片：这是什么，≤50 字 */
  summary: string;
  /** 悬浮卡片：为什么学，≤40 字 */
  why: string;
  /** 详情页概述，2–4 段 */
  description: string[];
  /** 详情页用途，3–6 条 */
  purposes: string[];
  /** 详情页素材，2–5 条 */
  resources: Resource[];
  /** 拼接知乎搜索，1–3 个 */
  zhihuKeywords: string[];
  /** 前置节点 id，空数组 = 起点 */
  prerequisites: string[];
}

export interface LearningGoal {
  /** 路由参数，如 'ai-llm' */
  id: string;
  /** 「AI 大模型」 */
  title: string;
  /** 一句话描述 */
  subtitle: string;
  /** 搜索命中用 */
  aliases: string[];
  /** 命中后展示的识别关键词 */
  searchHints: string[];
  categories: Category[];
  nodes: KnowledgeNode[];
}
