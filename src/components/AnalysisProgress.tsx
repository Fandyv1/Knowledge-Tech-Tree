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
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="micro">SURVEYING</span>
          <span className="h-px w-10 bg-white/15" aria-hidden="true" />
          <span className="micro-strong">
            {String(Math.round(progress * 100)).padStart(2, '0')}%
          </span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="btn-link shrink-0"
        >
          跳过动画 →
        </button>
      </div>

      <h1 className="display text-[28px] sm:text-[34px]">正在为你标定星图</h1>
      <p className="mt-2 text-[13px] text-paper-400">
        输入内容：
        <span className="mono ml-1 text-[12px] tracking-[0.08em] text-paper-200">
          {query.trim()}
        </span>
      </p>

      {/* 一发丝进度：底槽 + 黄铜金游标 */}
      <div className="relative mt-5 h-px w-full bg-white/12">
        <div
          className="absolute -top-px left-0 h-[3px] transition-[width] duration-300 ease-out"
          style={{
            width: `${Math.max(1, Math.round(progress * 100))}%`,
            background:
              'linear-gradient(90deg, rgba(168,137,79,0.2), #C9A96A 70%, #EFDCB4)',
            boxShadow: '0 0 12px rgba(201,169,106,0.6)',
          }}
        />
        <span className="ruler-x absolute -bottom-2.5 left-0 w-full opacity-40" />
      </div>

      <ol className="mt-8" aria-live="polite">
        {steps.map((step, index) => {
          const done = activeIndex === -1 || index < activeIndex;
          const active = index === activeIndex;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[9px] top-6 h-[calc(100%-14px)] w-px
                    transition-colors duration-300 ${
                      done ? 'bg-gold-500/60' : 'bg-white/10'
                    }`}
                />
              )}

              <span className="relative z-10 mt-1 flex h-[19px] w-[19px] shrink-0 items-center justify-center">
                {done ? (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rotate-45 bg-gold-300"
                    style={{ boxShadow: '0 0 10px rgba(222,197,146,0.9)' }}
                  />
                ) : active ? (
                  <span
                    aria-hidden="true"
                    className="h-[11px] w-[11px] animate-pulse rounded-full border border-gold-300"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-white/20"
                  />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`mono text-[9.5px] tracking-[0.18em] ${
                      done || active ? 'text-gold-300' : 'text-paper-500'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p
                    className={`font-serif text-[14.5px] tracking-[0.04em] transition-colors duration-300 ${
                      done || active ? 'text-paper-100' : 'text-paper-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                <p
                  className={`mt-1 text-[12.5px] leading-relaxed transition-colors duration-300 ${
                    done || active ? 'text-paper-400' : 'text-paper-500/60'
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
