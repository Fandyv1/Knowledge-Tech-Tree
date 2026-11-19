import type { LearningGoal } from '../types';

/**
 * 归一化搜索输入：trim → 全角转半角 → 小写 → 去掉空格与标点。
 * 纯函数，可单测。
 */
export function normalize(input: string): string {
  const halfWidth = input
    .trim()
    .replace(/[\uFF01-\uFF5E]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');

  return halfWidth
    .toLowerCase()
    .replace(/[\s]+/g, '')
    .replace(/[!-/:-@[-`{-~、。，！？；：“”‘’（）《》〈〉【】…—～·]/g, '');
}

/** 把一段文本按常见分隔切成词，用于 searchHints 的重叠判定。 */
function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,，、/|·+&]+/)
    .map((part) => normalize(part))
    .filter((part) => part.length > 0);
}

export interface GoalScore {
  goal: LearningGoal;
  score: number;
}

export const MATCH_THRESHOLD = 40;

/**
 * 对单个目标打分。规则（取各项最高的基础分，再叠加 hints 奖励）：
 *   输入 === goal.title          100
 *   输入 === 某个 alias           90
 *   输入包含某个 alias            60
 *   某个 alias 包含输入           40
 *   与 searchHints 有 ≥2 词重叠   +20
 */
export function scoreGoal(input: string, goal: LearningGoal): number {
  const query = normalize(input);
  if (query.length === 0) return 0;

  const title = normalize(goal.title);
  const aliases = goal.aliases.map((alias) => normalize(alias)).filter(Boolean);

  let base = 0;

  if (query === title) {
    base = 100;
  } else if (aliases.some((alias) => alias === query)) {
    base = 90;
  } else if (aliases.some((alias) => query.includes(alias))) {
    base = 60;
  } else if (aliases.some((alias) => alias.includes(query))) {
    base = 40;
  }

  // title 作为“被包含”的情况也应当被识别，例如输入「我想学 AI 大模型」
  if (base < 60 && query.includes(title)) {
    base = 60;
  }

  let bonus = 0;
  const queryTokens = new Set(tokenize(input));
  const hintTokens = goal.searchHints.map((hint) => normalize(hint)).filter(Boolean);
  const overlap = hintTokens.filter(
    (hint) => queryTokens.has(hint) || query.includes(hint),
  ).length;
  if (overlap >= 2) bonus = 20;

  return base === 0 ? 0 : base + bonus;
}

/** 返回得分最高且达到阈值的目标，否则返回 null。 */
export function matchGoal(
  input: string,
  goals: LearningGoal[],
): LearningGoal | null {
  const ranked = rankGoals(input, goals);
  const best = ranked[0];
  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best.goal;
}

/** 调试与测试用：返回全部目标的得分，按分值降序。 */
export function rankGoals(input: string, goals: LearningGoal[]): GoalScore[] {
  return goals
    .map((goal) => ({ goal, score: scoreGoal(input, goal) }))
    .sort((a, b) => b.score - a.score);
}
