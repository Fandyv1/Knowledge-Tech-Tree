import { describe, expect, it } from 'vitest';
import { goals } from '../data/goals';
import { collectGoalIssues } from './validate';
import { buildGraphIndex, countByCategory, getHighlightSet } from './graph';
import { zhihuSearchUrl } from './zhihu';

const aiLlm = goals[0]!;

describe('数据校验', () => {
  it('内置数据无结构性问题', () => {
    expect(collectGoalIssues(goals)).toEqual([]);
  });

  it('能检出悬空的前置引用', () => {
    const broken = {
      ...aiLlm,
      nodes: [
        { ...aiLlm.nodes[0]!, prerequisites: ['not-exist'] },
        ...aiLlm.nodes.slice(1),
      ],
    };
    const issues = collectGoalIssues([broken]);
    expect(issues.some((issue) => issue.kind === 'missing-prerequisite')).toBe(true);
  });

  it('能检出环', () => {
    const cyclic = {
      ...aiLlm,
      nodes: [
        { ...aiLlm.nodes[0]!, id: 'a', prerequisites: ['b'] },
        { ...aiLlm.nodes[1]!, id: 'b', prerequisites: ['a'] },
      ],
    };
    const issues = collectGoalIssues([cyclic]);
    expect(issues.some((issue) => issue.kind === 'cycle')).toBe(true);
  });
});

describe('图索引', () => {
  const index = buildGraphIndex(aiLlm);

  it('节点数与依赖边数符合预期', () => {
    expect(aiLlm.nodes).toHaveLength(24);
    expect(index.edgeCount).toBe(36);
  });

  it('内置三个学习目标，各 24 个节点', () => {
    expect(goals.map((goal) => goal.id)).toEqual([
      'ai-llm',
      'python-data',
      'math-exam',
    ]);
    for (const goal of goals) {
      expect(goal.nodes).toHaveLength(24);
      expect(goal.categories.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('起点深度为 0 且确实无前置', () => {
    for (const node of aiLlm.nodes) {
      if (node.prerequisites.length === 0) {
        expect(index.depth.get(node.id)).toBe(0);
      }
    }
  });

  it('每个节点的深度严格大于其所有前置', () => {
    for (const node of aiLlm.nodes) {
      const own = index.depth.get(node.id) ?? 0;
      for (const prerequisite of node.prerequisites) {
        expect(own).toBeGreaterThan(index.depth.get(prerequisite) ?? 0);
      }
    }
  });

  it('祖先集合包含间接前置', () => {
    // rlhf → sft → pretraining → transformer → attention → neural-net
    const ancestors = index.ancestors.get('rlhf');
    expect(ancestors?.has('sft')).toBe(true);
    expect(ancestors?.has('transformer')).toBe(true);
    expect(ancestors?.has('linear-algebra')).toBe(true);
  });

  it('高亮集合包含自身', () => {
    const set = getHighlightSet(index, 'transformer');
    expect(set.has('transformer')).toBe(true);
    expect(set.has('attention')).toBe(true);
  });

  it('类别计数总和等于节点总数', () => {
    const counts = countByCategory(aiLlm);
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBe(aiLlm.nodes.length);
  });
});

describe('知乎搜索 URL', () => {
  it('正确编码中文关键词', () => {
    expect(zhihuSearchUrl('线性代数')).toBe(
      'https://www.zhihu.com/search?type=content&q=%E7%BA%BF%E6%80%A7%E4%BB%A3%E6%95%B0',
    );
  });

  it('编码空格与特殊字符', () => {
    expect(zhihuSearchUrl('RAG 与微调 区别')).toContain('%20');
    expect(zhihuSearchUrl('a&b')).toContain('%26');
  });
});
