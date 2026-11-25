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

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1" />
            <path
              d="M12 3.8C12.6 9 15 11.4 20.2 12C15 12.6 12.6 15 12 20.2C11.4 15 9 12.6 3.8 12C9 11.4 11.4 9 12 3.8Z"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>
        </span>

        <input
          id="goal-input"
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          placeholder="例如：AI 大模型"
          aria-invalid={showEmptyHint}
          onChange={(event) => onChange(event.target.value)}
          className="field min-w-0"
        />
        <button
          type="submit"
          className="btn btn-gold absolute right-2 top-2 h-10"
        >
          <span className="hidden sm:inline">开始测绘</span>
          <span className="sm:hidden">测绘</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="mt-2 min-h-[18px]" aria-live="polite">
        {showEmptyHint && (
          <p className="mono text-[11px] tracking-[0.12em] text-ember-300">
            · 先告诉我你想学什么
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="micro mr-1">SAMPLE</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="chip"
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
