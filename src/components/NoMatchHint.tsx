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
      className="frame corners animate-fade-rise mt-6 p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <span className="micro-strong">NO MATCH</span>
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        <span className="micro">未收录</span>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-paper-200">
        星图中暂时没有「
        <span className="font-serif text-paper-50">{attempted}</span>」的坐标。
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-paper-400">
        演示版本只内置了一个学习目标，没有为其他方向伪造数据。
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onPickExample} className="btn btn-gold">
          查看{exampleLabel}
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={onClear} className="btn">
          换个关键词
        </button>
      </div>
    </div>
  );
}
