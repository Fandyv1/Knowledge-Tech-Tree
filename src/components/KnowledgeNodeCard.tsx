import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNode } from '../lib/layout';
import { useHighlight } from './HighlightContext';

/**
 * 自定义节点。
 * 高亮状态通过 Context 读取，使 nodes 数组引用保持稳定，
 * 避免每次 hover 触发 React Flow 的全量节点 diff。
 */
function KnowledgeNodeCard({ id, data }: NodeProps<FlowNode>) {
  const { hoveredId, selectedId, highlightSet } = useHighlight();
  const { node, category, depth, isRoot } = data;

  const dimmed = hoveredId !== null && !highlightSet.has(id);
  const onPath = hoveredId !== null && highlightSet.has(id);

  return (
    <div
      className="ktt-node"
      data-dimmed={dimmed}
      data-selected={selectedId === id}
      style={
        {
          '--depth': depth,
          '--accent': category.color,
          backgroundColor: onPath ? category.colorSoft : '#FFFFFF',
          borderColor: onPath ? category.color : '#E2E8F0',
        } as React.CSSProperties
      }
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />

      <span className="ktt-node__bar" style={{ backgroundColor: category.color }} />

      <div className="min-w-0 flex-1 pl-4 pr-3">
        <p className="truncate text-[13.5px] font-medium leading-tight text-ink-900">
          {node.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="truncate text-[11px] text-ink-500">{category.name}</span>
          {isRoot && (
            <span
              className="shrink-0 rounded border border-line bg-canvas px-1 py-px
                text-[10px] leading-tight text-ink-500"
            >
              起点
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

export default memo(KnowledgeNodeCard);
