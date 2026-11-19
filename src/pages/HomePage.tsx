import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LearningGoal } from '../types';
import { goals } from '../data/goals';
import { useAnalysisMachine } from '../hooks/useAnalysisMachine';
import SearchBox, { EXAMPLES } from '../components/SearchBox';
import AnalysisProgress from '../components/AnalysisProgress';
import NoMatchHint from '../components/NoMatchHint';

const DISCLAIMER = '分析基于本地预设知识库，未调用大模型';

export default function HomePage() {
  const navigate = useNavigate();

  const handleFinish = useCallback(
    (goal: LearningGoal) => {
      navigate(`/tree/${goal.id}`, { state: { fromSearch: true } });
    },
    [navigate],
  );

  const { state, steps, progress, onChange, onSubmit, onSkip } =
    useAnalysisMachine(handleFinish);

  const analyzing = state.phase === 'analyzing' || state.phase === 'leaving';
  const activeIndex = state.phase === 'analyzing' ? state.stepIndex : -1;

  return (
    <main className="flex min-h-full flex-col bg-canvas">
      <div className="flex flex-1 items-start justify-center px-5 pb-16 pt-[22vh] sm:pt-[26vh]">
        <div className="w-full max-w-[560px]">
          {analyzing ? (
            <AnalysisProgress
              query={state.query}
              steps={steps}
              activeIndex={activeIndex}
              progress={progress}
              onSkip={onSkip}
            />
          ) : (
            <>
              <header className="mb-8 text-center">
                <h1 className="text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[32px]">
                  知识科技树
                </h1>
                <p className="mt-2.5 text-[15px] text-ink-500">
                  说说你想学什么，为你生成一棵知识科技树
                </p>
              </header>

              <SearchBox
                value={state.query}
                shakeToken={state.phase === 'idle' ? state.shakeToken : 0}
                onChange={onChange}
                onSubmit={onSubmit}
              />

              {state.phase === 'noMatch' && (
                <NoMatchHint
                  attempted={state.attempted}
                  exampleLabel={goals[0]?.title ?? EXAMPLES[0]}
                  onPickExample={() => {
                    const example = goals[0]?.title ?? EXAMPLES[0];
                    onChange(example);
                    onSubmit(example);
                  }}
                  onClear={() => onChange('')}
                />
              )}
            </>
          )}
        </div>
      </div>

      <footer className="px-5 pb-8 text-center text-xs text-ink-400">
        {analyzing ? (
          <p>{DISCLAIMER}</p>
        ) : (
          <p>
            演示版本 · 当前内置 {goals.length} 个学习目标 · {DISCLAIMER}
          </p>
        )}
      </footer>
    </main>
  );
}
