interface NoMatchHintProps {
  attempted: string;
  exampleLabel: string;
  onPickExample: () => void;
  onClear: () => void;
}

export default function NoMatchHint({
  attempted,
  exampleLabel,
  onPickExample,
  onClear,
}: NoMatchHintProps) {
  return (
    <div
      className="glass-card animate-fade-rise mt-5 p-5"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-star-200">
        暂时还没有「<span className="font-medium text-star-100">{attempted}</span>
        」的知识库。
      </p>
      <p className="mt-1.5 text-sm text-star-400">
        演示版本只内置了一个学习目标，没有为其他方向伪造数据。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onPickExample} className="primary-button py-2">
          看看{exampleLabel}
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={onClear} className="ghost-button">
          换个关键词
        </button>
      </div>
    </div>
  );
}
