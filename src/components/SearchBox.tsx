import { useEffect, useRef } from 'react';

const EXAMPLES = ['AI 大模型', '大语言模型', 'LLM'];

interface SearchBoxProps {
  value: string;
  shakeToken: number;
  onChange: (value: string) => void;
  onSubmit: (value?: string) => void;
}

export default function SearchBox({
  value,
  shakeToken,
  onChange,
  onSubmit,
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showEmptyHint = shakeToken > 0 && value.trim().length === 0;

  return (
    <div className="w-full">
      <form
        /* shakeToken 作为 key 重建元素，使抖动动画可重复播放 */
        key={shakeToken}
        className={`relative w-full ${showEmptyHint ? 'animate-shake' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="goal-input" className="sr-only">
          想学什么
        </label>

        {/* 输入框外侧的紫色光晕 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 opacity-70"
          style={{
            background:
              'radial-gradient(28rem 10rem at 50% 50%, rgba(124,58,237,0.32), transparent 70%)',
            filter: 'blur(10px)',
          }}
        />

        <input
          id="goal-input"
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          placeholder="例如：AI 大模型"
          aria-invalid={showEmptyHint}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-full border border-white/12 bg-white/[0.05]
            pl-6 pr-[150px] text-base text-star-100 shadow-glass backdrop-blur-xl
            transition-colors duration-150 placeholder:text-star-400
            hover:border-nebula-400/40
            focus:border-nebula-400/70 focus:outline-none focus:ring-4
            focus:ring-nebula-500/20"
        />
        <button type="submit" className="primary-button absolute right-2 top-2 h-10">
          生成学习路径
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="mt-3 min-h-[20px] text-center" aria-live="polite">
        {showEmptyHint && (
          <p className="text-sm text-rose-300">先告诉我你想学什么</p>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-star-400">
        <span>试试：</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="pill-button"
            onClick={() => {
              onChange(example);
              onSubmit(example);
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

export { EXAMPLES };
