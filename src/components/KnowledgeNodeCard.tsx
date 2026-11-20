import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode } from '../lib/layout';
import { useHighlight } from './HighlightContext';

/**
 * 天体节点。
 * 高亮状态通过 Context 读取，使 nodes 数组引用保持稳定，
 * 避免每次 hover 触发 React Flow 的全量节点 diff。
 */
function KnowledgeNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { hoveredId, selectedId, highlightSet } = useHighlight();
  const { node, category, depth, kind, hue } = data;

  const dimmed = hoveredId !== null && !highlightSet.has(id);
  const lit =
    (hoveredId !== null && highlightSet.has(id)) || selectedId === id;

  return (
    <div
      className="celestial"
      data-dim={dimmed}
      data-lit={lit}
      style={
        {
          '--depth': depth,
          '--body-hue': hue,
          width: 150,
        } as React.CSSProperties
      }
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />

      <div className="relative grid place-items-center">
        {kind === 'star' ? (
          <span className="corona" aria-hidden="true" />
        ) : (
          <>
            <span className="halo" aria-hidden="true" />
            {kind === 'planet' && <span className="orbit-ring" aria-hidden="true" />}
          </>
        )}

        <div className={`body-core body-${kind}`}>
          <span className="sr-only">{node.title}</span>
        </div>

        <div className="celestial-text">
          <p className="celestial-label">{node.title}</p>
          <p className="celestial-sub">{category.name}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

export default memo(KnowledgeNodeCard);
