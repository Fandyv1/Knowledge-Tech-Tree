import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { LearningGoal } from '../types';
import { goals } from '../data/goals';
import { matchGoal } from '../lib/matchGoal';
import {
  ANALYSIS_STEP_COUNT,
  buildAnalysisSteps,
  buildStepDurations,
  type AnalysisStep,
} from '../lib/analyzeSteps';
import { useReducedMotion } from './useReducedMotion';

export type HomeState =
  | { phase: 'idle'; query: string; shakeToken: number }
  | { phase: 'noMatch'; query: string; attempted: string }
  | {
      phase: 'analyzing';
      query: string;
      goal: LearningGoal;
      stepIndex: number;
      durations: number[];
    }
  | { phase: 'leaving'; query: string; goal: LearningGoal };

type HomeAction =
  | { type: 'CHANGE'; value: string }
  | { type: 'SUBMIT'; value?: string; durations: number[] }
  | { type: 'TICK' }
  | { type: 'SKIP' };

const initialState: HomeState = { phase: 'idle', query: '', shakeToken: 0 };

const shakeTokenOf = (state: HomeState): number =>
  state.phase === 'idle' ? state.shakeToken : 0;

function reducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case 'CHANGE':
      // 输入变化一律回到 idle，未命中提示随之消失
      return { phase: 'idle', query: action.value, shakeToken: shakeTokenOf(state) };

    case 'SUBMIT': {
      const raw = action.value ?? state.query;
      const trimmed = raw.trim();

      // 空输入不是独立相位，仅自增 shakeToken 触发一次抖动
      if (trimmed.length === 0) {
        return { phase: 'idle', query: raw, shakeToken: shakeTokenOf(state) + 1 };
      }

      const goal = matchGoal(trimmed, goals);
      if (!goal) {
        return { phase: 'noMatch', query: raw, attempted: trimmed };
      }

      return {
        phase: 'analyzing',
        query: raw,
        goal,
        stepIndex: 0,
        durations: action.durations,
      };
    }

    case 'TICK':
      if (state.phase !== 'analyzing') return state;
      return state.stepIndex >= ANALYSIS_STEP_COUNT - 1
        ? { phase: 'leaving', query: state.query, goal: state.goal }
        : { ...state, stepIndex: state.stepIndex + 1 };

    case 'SKIP':
      if (state.phase !== 'analyzing') return state;
      return { phase: 'leaving', query: state.query, goal: state.goal };

    default:
      return state;
  }
}

export interface HomeMachine {
  state: HomeState;
  steps: AnalysisStep[];
  /** 0–1，驱动进度条宽度 */
  progress: number;
  onChange: (value: string) => void;
  onSubmit: (value?: string) => void;
  onSkip: () => void;
}

/**
 * 首页「搜索态 + 分析态」状态机。
 * 步骤推进的 timer 由单个 effect 持有，跳过、卸载、重复提交都由 cleanup 兜住。
 */
export function useAnalysisMachine(
  onFinish: (goal: LearningGoal) => void,
): HomeMachine {
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);

  const onChange = useCallback((value: string) => {
    dispatch({ type: 'CHANGE', value });
  }, []);

  const onSubmit = useCallback(
    (value?: string) => {
      dispatch({ type: 'SUBMIT', value, durations: buildStepDurations(reducedMotion) });
    },
    [reducedMotion],
  );

  const onSkip = useCallback(() => dispatch({ type: 'SKIP' }), []);

  // 为 effect 依赖抽出稳定标量，避免在依赖数组里写条件表达式
  const phase = state.phase;
  const stepIndex = state.phase === 'analyzing' ? state.stepIndex : -1;
  const stepDelay =
    state.phase === 'analyzing' ? (state.durations[state.stepIndex] ?? 500) : 0;
  const activeGoal =
    state.phase === 'analyzing' || state.phase === 'leaving' ? state.goal : null;
  const activeQuery = state.query;

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timer = window.setTimeout(() => dispatch({ type: 'TICK' }), stepDelay);
    return () => window.clearTimeout(timer);
  }, [phase, stepIndex, stepDelay]);

  // 唯一导航出口：自然结束与「跳过动画」都汇聚到 leaving，不会重复跳转
  useEffect(() => {
    if (phase !== 'leaving' || !activeGoal) return;
    onFinish(activeGoal);
  }, [phase, activeGoal, onFinish]);

  const steps = useMemo(
    () => (activeGoal ? buildAnalysisSteps(activeGoal, activeQuery) : []),
    [activeGoal, activeQuery],
  );

  const progress =
    phase === 'analyzing'
      ? (stepIndex + 1) / ANALYSIS_STEP_COUNT
      : phase === 'leaving'
        ? 1
        : 0;

  return { state, steps, progress, onChange, onSubmit, onSkip };
}
