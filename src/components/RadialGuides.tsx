import type { RadialMeta } from '../lib/layout';
import { CORE_R } from '../lib/layout';

interface RadialGuidesProps {
  radial: RadialMeta;
  viewport: { x: number; y: number; zoom: number };
}

const STAR =
  'M0 -22 C 2.4 -7.5, 7.5 -2.4, 22 0 C 7.5 2.4, 2.4 7.5, 0 22 C -2.4 7.5, -7.5 2.4, -22 0 C -7.5 -2.4, -2.4 -7.5, 0 -22 Z';

/**
 * 星图底纹：同心轨道、类别射线与中心罗盘。
 * 直接跟随 React Flow 的视口变换，位于节点与连线之下，不参与命中。
 */
export function CorePlate({
  viewport,
}: {
  viewport: { x: number; y: number; zoom: number };
}) {
  return (
    <div
      className="radial-core-plate"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      }}
      aria-hidden="true"
    >
      <svg width="160" height="160" viewBox="-80 -80 160 160">
        <defs>
          <radialGradient id="ktt-core-fade">
            <stop offset="52%" stopColor="#04050A" stopOpacity="1" />
            <stop offset="82%" stopColor="#04050A" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#04050A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="76" fill="url(#ktt-core-fade)" />
        <circle className="radial-core-ring" r={CORE_R} />
        <circle
          className="radial-core-ring radial-core-ring--dashed"
          r={CORE_R - 13}
        />
        <path className="radial-cross" d="M-70 0H70M0 -70V70" />
        <path className="radial-star" d={STAR} />
        <circle className="radial-core-dot" r="3" />
      </svg>
    </div>
  );
}

export default function RadialGuides({ radial, viewport }: RadialGuidesProps) {
  const { rings, sectors, maxRadius } = radial;
  const outer = maxRadius + 44;
  const polar = (angle: number, radius: number) =>
    `${Math.cos(angle) * radius} ${Math.sin(angle) * radius}`;
  const wedge = (start: number, end: number) => {
    const span = end - start;
    const large = span > Math.PI ? 1 : 0;
    return [
      `M ${polar(start, CORE_R)}`,
      `L ${polar(start, outer)}`,
      `A ${outer} ${outer} 0 ${large} 1 ${polar(end, outer)}`,
      `L ${polar(end, CORE_R)}`,
      `A ${CORE_R} ${CORE_R} 0 ${large} 0 ${polar(start, CORE_R)}`,
      'Z',
    ].join(' ');
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute left-0 top-0 h-full w-full overflow-visible"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <g>
          {sectors.map((sector) => (
            <path
              key={`wedge-${sector.id}`}
              d={wedge(sector.start, sector.end)}
              fill={sector.color}
              opacity={0.07}
            />
          ))}

          {rings.map((radius) => (
            <circle key={radius} className="radial-ring" r={radius} />
          ))}

          {sectors.map((sector) => (
            <g key={sector.id}>
              <line
                className="radial-ray"
                x1={Math.cos(sector.start) * CORE_R}
                y1={Math.sin(sector.start) * CORE_R}
                x2={Math.cos(sector.start) * outer}
                y2={Math.sin(sector.start) * outer}
              />
              <line
                className="radial-ray radial-ray--mid"
                x1={Math.cos(sector.mid) * CORE_R}
                y1={Math.sin(sector.mid) * CORE_R}
                x2={Math.cos(sector.mid) * outer}
                y2={Math.sin(sector.mid) * outer}
                style={{ stroke: sector.color }}
              />
            </g>
          ))}

        </g>
      </svg>
    </div>
  );
}
