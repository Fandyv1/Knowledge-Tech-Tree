import { memo } from 'react';
import type { EdgeProps } from '@xyflow/react';
import type { FlowEdge } from '../lib/layout';

/**
 * 星座连线：发丝级细线 + 两端小圆点。
 * 端点坐标在 layout 阶段已按星点半径裁剪，因此线的起止恰好停在星点外缘，
 * 不依赖 React Flow 的 handle 位置，缩放时始终保持星图的几何感。
 */
function ConstellationEdge({ data }: EdgeProps<FlowEdge>) {
  if (!data) return null;
  const { x1, y1, x2, y2 } = data;
  const d = `M${x1},${y1} L${x2},${y2}`;

  return (
    <g>
      <path className="constellation-edge__glow" d={d} />
      <path className="constellation-edge__line" d={d} />
      <circle
        className="constellation-edge__dot constellation-edge__dot--source"
        cx={x1}
        cy={y1}
        r={1.1}
      />
      <circle className="constellation-edge__dot" cx={x2} cy={y2} r={1.7} />
    </g>
  );
}

export default memo(ConstellationEdge);
