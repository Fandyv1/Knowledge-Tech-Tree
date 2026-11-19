import { useLayoutEffect, useRef, useState } from 'react';
import type { Category, KnowledgeNode } from '../types';

const CARD_MAX_WIDTH = 280;
const GAP = 12;
const EDGE_PADDING = 8;

export interface HoverTarget {
  node: KnowledgeNode;
  category: Category;
  /** 节点在画布容器内的屏幕坐标与尺寸 */
  rect: { x: number; y: number; width: number; height: number };
}

interface HoverCardProps {
  target: HoverTarget;
  /** 画布容器尺寸，用于边界翻转与水平钳制 */
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
  const [size, setSize] = useState({ width: CARD_MAX_WIDTH, height: 150 });

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
  // 优先放在节点上方，空间不足则翻到下方
  const placeAbove = rect.y - size.height - GAP >= EDGE_PADDING;
  const top = placeAbove ? rect.y - size.height - GAP : rect.y + rect.height + GAP;

  // 水平居中对齐节点，并钳制在容器内，保证卡片完整可见
  const rawLeft = rect.x + rect.width / 2 - size.width / 2;
  const maxLeft = Math.max(EDGE_PADDING, container.width - size.width - EDGE_PADDING);
  const left = Math.min(Math.max(rawLeft, EDGE_PADDING), maxLeft);

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="surface-card animate-fade-rise pointer-events-auto absolute z-50 p-4 shadow-hover"
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
      <span
        className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: target.category.colorSoft,
          color: target.category.color,
        }}
      >
        {target.category.name}
      </span>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink-900">
        {target.node.title}
      </h3>

      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">
        {target.node.summary}
      </p>

      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-500">
        <span className="font-medium text-ink-700">💡 为什么学</span>
        <br />
        {target.node.why}
      </p>

      <p className="mt-3 text-[12px] font-medium text-sky-700">点击查看详情 →</p>
    </div>
  );
}
