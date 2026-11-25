import { describe, expect, it } from 'vitest';
import { goals } from '../data/goals';
import { MATCH_THRESHOLD, matchGoal, normalize, scoreGoal } from './matchGoal';

const aiLlm = goals[0]!;

describe('normalize', () => {
  it('去除首尾空格并转小写', () => {
    expect(normalize('  LLM  ')).toBe('llm');
  });

  it('全角字符转半角', () => {
    expect(normalize('ＬＬＭ')).toBe('llm');
  });

  it('去掉内部空格与标点', () => {
    expect(normalize('AI 大模型！')).toBe('ai大模型');
    expect(normalize('ai, 大模型')).toBe('ai大模型');
  });
});

describe('scoreGoal 打分规则', () => {
  it('与 title 完全相同得 100 分（含 hints 奖励）', () => {
    // 「AI 大模型」归一化后同时命中 AI 与 大模型 两个 hint，故叠加 20 分
    expect(scoreGoal('AI 大模型', aiLlm)).toBe(120);
  });

  it('与某个 alias 完全相同得 90 分', () => {
    expect(scoreGoal('大语言模型', aiLlm)).toBe(90);
    // 只命中 LLM 一个 hint，不满足「≥2 词重叠」的奖励条件
    expect(scoreGoal('llm', aiLlm)).toBe(90);
  });

  it('命中 ≥2 个 searchHints 时叠加 20 分', () => {
    // 「ai大模型」同时包含 ai 与 大模型 两个 hint
    expect(scoreGoal('ai大模型', aiLlm)).toBe(120);
    // 「大模型」只命中一个 hint，无奖励
    expect(scoreGoal('大模型', aiLlm)).toBe(90);
  });

  it('输入包含某个 alias 得 60 分', () => {
    expect(scoreGoal('我想学大模型', aiLlm)).toBe(60);
  });

  it('alias 包含输入得 40 分，刚好达到阈值', () => {
    expect(scoreGoal('大模', aiLlm)).toBe(40);
    expect(scoreGoal('大模', aiLlm)).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  it('完全无关的输入得 0 分', () => {
    expect(scoreGoal('如何做红烧肉', aiLlm)).toBe(0);
    expect(scoreGoal('', aiLlm)).toBe(0);
  });
});

describe('matchGoal', () => {
  it.each(['AI 大模型', '大模型', 'LLM', '我想学 ai', '大语言模型', 'GPT', 'ＡＩ大模型'])(
    '「%s」应命中 ai-llm',
    (input) => {
      expect(matchGoal(input, goals)?.id).toBe('ai-llm');
    },
  );

  it.each([
    ['Python 数据分析', 'python-data'],
    ['pandas', 'python-data'],
    ['数据分析', 'python-data'],
    ['考研数学', 'math-exam'],
    ['高数', 'math-exam'],
    ['数一', 'math-exam'],
  ])('「%s」应命中 %s', (input, goalId) => {
    expect(matchGoal(input, goals)?.id).toBe(goalId);
  });

  it.each(['如何做红烧肉', '摄影构图', '', '   '])(
    '「%s」应返回 null',
    (input) => {
      expect(matchGoal(input, goals)).toBeNull();
    },
  );
});
