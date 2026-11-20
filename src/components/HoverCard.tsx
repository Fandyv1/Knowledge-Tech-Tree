import { useLayoutEffect, useRef, useState } from 'react';
import type { Category, KnowledgeNode } from '../types';
import { BODY_DESC, BODY_LABEL, type BodyKind } from '../lib/celestial';

const CARD_MAX_WIDTH = 288;
const GAP = 14;
const EDGE_PADDING = 10;

export interface HoverTarget {
  node: KnowledgeNode;
  category: Category;
  kind: BodyKind;
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

export default function HoverCard({
  target,
  container,
  onEnter,
  onLeave,
  onOpen,
}: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: CARD_MAX_WIDTH, height: 170 });

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
  // 优先放在天体上方，空间不足则翻到下方
  const placeAbove = rect.y - size.height - GAP >= EDGE_PADDING;
  const top = placeAbove ? rect.y - size.height - GAP : rect.y + rect.height + GAP;

  // 水平居中对齐天体，并钳制在容器内
  const rawLeft = rect.x + rect.width / 2 - size.width / 2;
  const maxLeft = Math.max(EDGE_PADDING, container.width - size.width - EDGE_PADDING);
  const left = Math.min(Math.max(rawLeft, EDGE_PADDING), maxLeft);

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="glass-card animate-fade-rise pointer-events-auto absolute z-50 p-4"
      style={{
        top,
        left,
        maxWidth: CARD_MAX_WIDTH,
        width: 'max-content',
        boxShadow:
          '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 16px 48px -12px rgba(0,0,0,0.85), 0 0 32px -8px rgba(168,85,247,0.35)',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onOpen}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: target.category.colorSoft,
            color: target.category.color,
          }}
        >
          {target.category.name}
        </span>
        <span className="text-[11px] text-star-400">
          {BODY_LABEL[target.kind]} · {BODY_DESC[target.kind]}
        </span>
      </div>

      <h3 className="mt-2.5 text-[15.5px] font-semibold leading-snug text-star-100">
        {target.node.title}
      </h3>

      <p className="mt-1.5 text-[13px] leading-relaxed text-star-200">
        {target.node.summary}
      </p>

      <p className="mt-2.5 text-[13px] leading-relaxed text-star-300">
        <span className="font-medium text-star-200">💡 为什么学</span>
        <br />
        {target.node.why}
      </p>

      <p className="mt-3 text-[12px] font-medium text-nebula-300">点击查看详情 →</p>
    </div>
  );
}
