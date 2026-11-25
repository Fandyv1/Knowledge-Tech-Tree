import { useLayoutEffect, useRef, useState } from 'react';
import type { Category, KnowledgeNode } from '../types';
import { STAR_DESC, STAR_LABEL, STAR_LATIN, type StarClass } from '../lib/starmap';

const CARD_MAX_WIDTH = 296;
const GAP = 16;
const EDGE_PADDING = 12;

export interface HoverTarget {
  node: KnowledgeNode;
  category: Category;
  starClass: StarClass;
  order: number;
  coord: string;
  /** 节点在画布容器内的屏幕坐标与尺寸 */
  rect: { x: number; y: number; width: number; height: number };
}

interface HoverCardProps {
  target: HoverTarget;
  container: { width: number; height: number };
  onEnter: () => void;
  onLeave: () => void;
  onOpen: () => void;
}

/** 星座档案卡：编号、星等、坐标、摘要 */
export default function HoverCard({
  target,
  container,
  onEnter,
  onLeave,
  onOpen,
}: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: CARD_MAX_WIDTH, height: 210 });

  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const { offsetWidth, offsetHeight } = element;
    setSize((prev) =>
      prev.width === offsetWidth && prev.height === offsetHeight
        ? prev
        : { width: offsetWidth, height: offsetHeight },
    );
  }, [target.node.id]);

  const { rect } = target;
  const placeAbove = rect.y - size.height - GAP >= EDGE_PADDING;
  const top = placeAbove ? rect.y - size.height - GAP : rect.y + rect.height + GAP;

  const rawLeft = rect.x + rect.width / 2 - size.width / 2;
  const maxLeft = Math.max(
    EDGE_PADDING,
    container.width - size.width - EDGE_PADDING,
  );
  const left = Math.min(Math.max(rawLeft, EDGE_PADDING), maxLeft);

  const archiveNo = String(target.order).padStart(2, '0');

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="archive-card animate-fade-rise pointer-events-auto absolute z-50 p-4"
      style={{
        top,
        left,
        maxWidth: CARD_MAX_WIDTH,
        width: 'max-content',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onOpen}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <span className="micro-strong">ARCHIVE K-{archiveNo}</span>
        <span className="micro">
          {STAR_LATIN[target.starClass]} · {STAR_LABEL[target.starClass]}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rotate-45"
          style={{
            backgroundColor: target.category.color,
            boxShadow: `0 0 10px ${target.category.color}`,
          }}
        />
        <span
          className="text-[11px] tracking-[0.14em]"
          style={{ color: target.category.color }}
        >
          {target.category.name}
        </span>
      </div>

      <h3 className="mt-2 font-serif text-[18px] font-semibold leading-snug text-paper-50">
        {target.node.title}
      </h3>

      <p className="mt-2 text-[12.5px] leading-relaxed text-paper-200">
        {target.node.summary}
      </p>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <p className="micro">WHY · 为什么学</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-paper-300">
          {target.node.why}
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-2">
        <span className="micro truncate">{target.coord}</span>
        <span className="shrink-0 text-[11.5px] text-gold-300">
          进入档案 →
        </span>
      </div>

      <span className="sr-only">{STAR_DESC[target.starClass]}</span>
    </div>
  );
}
