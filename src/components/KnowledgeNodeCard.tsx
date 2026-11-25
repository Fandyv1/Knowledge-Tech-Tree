import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode } from '../lib/layout';
import { STAR_LATIN } from '../lib/starmap';
import { useHighlight } from './HighlightContext';

/** 四芒星：尖点在外、弧边内凹，参考星图中的高亮恒星 */
const SPARK =
  'M0 -50 C 5.5 -17, 17 -5.5, 50 0 C 17 5.5, 5.5 17, 0 50 C -5.5 17, -17 5.5, -50 0 C -17 -5.5, -5.5 -17, 0 -50 Z';

function StarGlyph({ radius, color }: { radius: number; color: string }) {
  const size = Math.round(radius * 3.4);
  return (
    <span
      className="star-node__glyph"
      style={{ width: size, height: size, color }}
    >
      <span className="star-node__halo" aria-hidden="true" />
      <svg
        width={size}
        height={size}
        viewBox="-50 -50 100 100"
        aria-hidden="true"
        focusable="false"
      >
        {/* 极长的十字光芒，放大时也不会糊成一团 */}
        <path
          d="M-62 0H62M0 -62V62"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.34"
        />
        <path d={SPARK} fill="currentColor" opacity="0.92" />
        <path
          d={SPARK}
          fill="#F8F5EC"
          opacity="0.6"
          transform="scale(0.36)"
        />
        <circle r="4.6" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

/**
 * 星图节点：一颗星 + 下方的中文名与星等。
 * 高亮状态通过 Context 读取，使 nodes 数组引用保持稳定，
 * 避免每次 hover 触发 React Flow 的全量节点 diff。
 */
function KnowledgeNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { hoveredId, selectedId, highlightSet } = useHighlight();
  const { node, category, depth, starClass, radius } = data;

  const dimmed = hoveredId !== null && !highlightSet.has(id);
  const lit = (hoveredId !== null && highlightSet.has(id)) || selectedId === id;

  return (
    <div
      className="star-node"
      data-dim={dimmed}
      data-lit={lit}
      data-selected={selectedId === id}
      style={
        {
          '--depth': depth,
          '--star-color': category.color,
        } as React.CSSProperties
      }
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />

      <div className="star-node__orb">
        <svg
          className="star-node__ring"
          viewBox="0 0 54 54"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="27"
            cy="27"
            r="23"
            fill="none"
            stroke="rgba(222,197,146,0.78)"
            strokeWidth="0.8"
            strokeDasharray="2 5"
          />
          <path
            d="M27 2V7M27 47V52M2 27H7M47 27H52"
            stroke="rgba(239,234,222,0.6)"
            strokeWidth="1"
          />
        </svg>

        <StarGlyph radius={radius} color={category.color} />
      </div>

      <div className="star-node__text">
        <p className="star-node__name">{node.title}</p>
        <p className="star-node__meta">
          {category.name} · {STAR_LATIN[starClass]}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

export default memo(KnowledgeNodeCard);
