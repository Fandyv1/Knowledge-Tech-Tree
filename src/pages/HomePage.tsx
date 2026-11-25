import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LearningGoal } from '../types';
import { goals } from '../data/goals';
import { useAnalysisMachine } from '../hooks/useAnalysisMachine';
import SearchBox from '../components/SearchBox';
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

  const primary = goals[0];
  const fallbackTitle = primary?.title ?? 'AI 大模型';
  const examples = goals.map((goal) => goal.title);
  const starCount = goals.reduce((sum, goal) => sum + goal.nodes.length, 0);
  const linkCount = goals.reduce(
    (sum, goal) =>
      sum +
      goal.nodes.reduce(
        (total, node) => total + node.prerequisites.length,
        0,
      ),
    0,
  );

  return (
    <main className="relative flex min-h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <OrbitDeco />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-6 sm:px-9">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="leading-none">
            <p className="font-serif text-[12.5px] tracking-[0.2em] text-paper-200">
              知识科技树
            </p>
            <p className="micro mt-1 text-[9px]">KNOWLEDGE ATLAS</p>
          </div>
        </div>
        <p className="micro hidden sm:block">LOCAL ARCHIVE · VOL. 01</p>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full min-w-0 max-w-[620px]">
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
              <div className="mb-6 flex items-center gap-3">
                <span className="micro">FIG. 01</span>
                <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
                <span className="micro hidden sm:inline">LEARNING PATH ATLAS</span>
              </div>

              <h1 className="display text-[40px] sm:text-[54px]">
                知识科技树
              </h1>

              <p className="mt-4 font-serif text-[15px] leading-relaxed tracking-[0.06em] text-paper-300 sm:text-[16px]">
                说说你想学什么，为你点亮一片知识星系
              </p>

              <div className="mt-7 rule-diamond" aria-hidden="true">
                <span />
              </div>

              <div className="mt-8">
                <SearchBox
                  value={state.query}
                  shakeToken={state.phase === 'idle' ? state.shakeToken : 0}
                  onChange={onChange}
                  onSubmit={onSubmit}
                  examples={examples}
                />
              </div>

              {state.phase === 'noMatch' && (
                <NoMatchHint
                  attempted={state.attempted}
                  exampleLabel={fallbackTitle}
                  onPickExample={() => {
                    const example = fallbackTitle;
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

      <footer className="relative z-10 px-5 pb-6 sm:px-9">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
            <Stat label="TARGETS" value={String(goals.length).padStart(2, '0')} />
            <Stat label="STARS" value={String(starCount).padStart(2, '0')} />
            <Stat label="LINKS" value={String(linkCount).padStart(2, '0')} />
          </div>
          <p className="micro leading-relaxed">
            演示版本 · {DISCLAIMER}
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="micro">{label}</span>
      <span className="mono text-[11px] tracking-[0.16em] text-paper-200">
        {value}
      </span>
    </span>
  );
}

/** 极简星徽：四芒星 + 外环，呼应游戏里的「宇宙组曲」角标 */
function BrandMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className="text-paper-200"
    >
      <circle
        cx="20"
        cy="20"
        r="15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M20 4.5C21 15 25 19 35.5 20C25 21 21 25 20 35.5C19 25 15 21 4.5 20C15 19 19 15 20 4.5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="20" cy="20" r="2" fill="#04050A" />
    </svg>
  );
}

/** 背景装饰：同心轨道、倾斜椭圆与星点，静态但极淡 */
function OrbitDeco() {
  return (
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      width="1100"
      height="1100"
      viewBox="0 0 1100 1100"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="rgba(239,234,222,0.14)" strokeWidth="0.8">
        <circle cx="550" cy="550" r="210" strokeDasharray="1 8" />
        <circle cx="550" cy="550" r="320" opacity="0.7" />
        <circle cx="550" cy="550" r="430" strokeDasharray="2 12" opacity="0.55" />
        <ellipse
          cx="550"
          cy="550"
          rx="520"
          ry="190"
          transform="rotate(-16 550 550)"
          opacity="0.6"
        />
        <ellipse
          cx="550"
          cy="550"
          rx="470"
          ry="150"
          transform="rotate(24 550 550)"
          opacity="0.35"
        />
      </g>
      <g fill="rgba(239,234,222,0.65)">
        <circle cx="550" cy="120" r="1.6" />
        <circle cx="890" cy="410" r="1.2" />
        <circle cx="230" cy="760" r="1.4" />
        <circle cx="760" cy="900" r="1" />
        <circle cx="150" cy="300" r="1.1" />
      </g>
      <g fill="rgba(222,197,146,0.55)">
        <circle cx="930" cy="690" r="1.3" />
        <circle cx="300" cy="450" r="1" />
      </g>
      <g stroke="rgba(239,234,222,0.35)" strokeWidth="1">
        <path d="M550 116v8M550 976v8M116 550h8M976 550h8" />
      </g>
    </svg>
  );
}
