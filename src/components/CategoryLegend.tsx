import type { Category } from '../types';
import { STAR_LABEL, STAR_RADIUS, type StarClass } from '../lib/starmap';

interface CategoryLegendProps {
  categories: Category[];
  counts: Map<string, number>;
}

/** 四芒星缩略图，与画布节点同形 */
export function MiniStar({
  size,
  color = 'rgba(239,234,222,0.85)',
}: {
  size: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <path
        d="M0 -50 C 5.5 -17, 17 -5.5, 50 0 C 17 5.5, 5.5 17, 0 50 C -5.5 17, -17 5.5, -50 0 C -17 -5.5, -5.5 -17, 0 -50 Z"
        fill={color}
      />
      <circle r="7" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

const MAGNITUDES: StarClass[] = ['anchor', 'relay', 'terminal'];

export default function CategoryLegend({
  categories,
  counts,
}: CategoryLegendProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
      <span className="micro hidden md:inline">CATEGORY</span>
      <ul className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-1.5 text-[12px]"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rotate-45"
              style={{
                backgroundColor: category.color,
                boxShadow: `0 0 8px ${category.color}`,
              }}
            />
            <span className="text-paper-200">{category.name}</span>
            <span className="mono text-[10px] text-paper-400">
              {String(counts.get(category.id) ?? 0).padStart(2, '0')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 星等图例：放在画布 HUD 右下角 */
export function StarLegend() {
  return (
    <div className="hud-panel flex items-center gap-3 px-3 py-2">
      {MAGNITUDES.map((starClass) => (
        <span
          key={starClass}
          className="flex items-center gap-1.5 text-[10.5px] text-paper-300"
        >
          <MiniStar size={Math.max(6, STAR_RADIUS[starClass] * 0.8)} />
          {STAR_LABEL[starClass]}
        </span>
      ))}
    </div>
  );
}
