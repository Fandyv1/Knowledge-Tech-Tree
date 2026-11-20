import type { AnalysisStep } from '../lib/analyzeSteps';

interface AnalysisProgressProps {
  query: string;
  steps: AnalysisStep[];
  /** 当前进行中的步骤序号；-1 表示全部完成 */
  activeIndex: number;
  progress: number;
  onSkip: () => void;
}

export default function AnalysisProgress({
  query,
  steps,
  activeIndex,
  progress,
  onSkip,
}: AnalysisProgressProps) {
  return (
    <div className="animate-fade-rise w-full">
      <div className="mb-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: 'linear-gradient(90deg, #7C3AED, #A855F7, #C4A4FF)',
            boxShadow: '0 0 12px rgba(168,85,247,0.75)',
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-4 pt-5">
        <div>
          <h1 className="text-xl font-semibold text-star-100">
            正在为你规划学习路径…
          </h1>
          <p className="mt-1 text-sm text-star-400">
            输入内容：<span className="text-star-200">{query.trim()}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="shrink-0 text-sm text-star-400 underline-offset-4 transition-colors
            duration-150 hover:text-nebula-300 hover:underline"
        >
          跳过动画 →
        </button>
      </div>

      <ol className="mt-7" aria-live="polite">
        {steps.map((step, index) => {
          const done = activeIndex === -1 || index < activeIndex;
          const active = index === activeIndex;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3.5 pb-5 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[11px] top-7 h-[calc(100%-18px)] w-px
                    transition-colors duration-300 ${
                      done ? 'bg-nebula-500/60' : 'bg-white/10'
                    }`}
                />
              )}

              <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {done ? (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full
                      text-[11px] font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                      boxShadow: '0 0 14px -2px rgba(168,85,247,0.8)',
                    }}
                  >
                    ✓
                  </span>
                ) : active ? (
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2
                      border-nebula-500/25 border-t-nebula-400"
                  />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                )}
              </span>

              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    done || active ? 'text-star-100' : 'text-star-400/60'
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`mt-0.5 text-sm transition-colors duration-300 ${
                    done || active ? 'text-star-300' : 'text-star-400/45'
                  }`}
                >
                  {step.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
