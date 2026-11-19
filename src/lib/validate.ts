import type { LearningGoal } from '../types';

export interface ValidationIssue {
  goalId: string;
  kind: 'duplicate-node-id' | 'missing-prerequisite' | 'cycle' | 'unknown-category';
  detail: string;
}

/**
 * 校验学习目标数据的结构完整性。
 * 返回问题列表而不直接抛错，便于单元测试与调用方自行决定处理方式。
 */
export function collectGoalIssues(goals: LearningGoal[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const goal of goals) {
    const seen = new Set<string>();
    for (const node of goal.nodes) {
      if (seen.has(node.id)) {
        issues.push({
          goalId: goal.id,
          kind: 'duplicate-node-id',
          detail: `节点 id 重复：${node.id}`,
        });
      }
      seen.add(node.id);
    }

    const categoryIds = new Set(goal.categories.map((category) => category.id));
    for (const node of goal.nodes) {
      if (!categoryIds.has(node.category)) {
        issues.push({
          goalId: goal.id,
          kind: 'unknown-category',
          detail: `节点 ${node.id} 引用了未定义的类别：${node.category}`,
        });
      }
    }

    for (const node of goal.nodes) {
      for (const prerequisite of node.prerequisites) {
        if (!seen.has(prerequisite)) {
          issues.push({
            goalId: goal.id,
            kind: 'missing-prerequisite',
            detail: `节点 ${node.id} 的前置 ${prerequisite} 不存在`,
          });
        }
      }
    }

    const cycle = findCycle(goal);
    if (cycle) {
      issues.push({
        goalId: goal.id,
        kind: 'cycle',
        detail: `依赖图存在环：${cycle.join(' → ')}`,
      });
    }
  }

  return issues;
}

/** 用 DFS 三色标记找出一条环路径，无环返回 null。 */
function findCycle(goal: LearningGoal): string[] | null {
  const prerequisitesOf = new Map<string, string[]>(
    goal.nodes.map((node) => [node.id, node.prerequisites]),
  );
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const walk = (id: string): string[] | null => {
    const current = state.get(id);
    if (current === 'done') return null;
    if (current === 'visiting') {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }

    state.set(id, 'visiting');
    stack.push(id);
    for (const next of prerequisitesOf.get(id) ?? []) {
      if (!prerequisitesOf.has(next)) continue;
      const found = walk(next);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };

  for (const node of goal.nodes) {
    const found = walk(node.id);
    if (found) return found;
  }
  return null;
}

/** 开发期入口：发现问题即抛出，让错误在控制台立刻可见。 */
export function validateGoals(goals: LearningGoal[]): void {
  const issues = collectGoalIssues(goals);
  if (issues.length === 0) return;

  const message = issues
    .map((issue) => `[${issue.goalId}] ${issue.kind}: ${issue.detail}`)
    .join('\n');
  throw new Error(`学习目标数据校验失败：\n${message}`);
}
