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
        <input
          id="goal-input"
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          placeholder="例如：AI 大模型"
          aria-invalid={showEmptyHint}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-full border border-line bg-white pl-6 pr-[148px]
            text-base text-ink-900 shadow-card transition-colors duration-150
            placeholder:text-ink-400 hover:border-sky-200
            focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 inline-flex h-10 items-center gap-1.5 rounded-full
            bg-sky-600 px-5 text-sm font-medium text-white transition-colors duration-150
            hover:bg-sky-700 focus-visible:ring-offset-0"
        >
          生成学习路径
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="mt-3 min-h-[20px] text-center" aria-live="polite">
        {showEmptyHint && (
          <p className="text-sm text-rose-600">先告诉我你想学什么</p>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-500">
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
