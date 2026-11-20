import type { Category } from '../types';

interface CategoryLegendProps {
  categories: Category[];
  counts: Map<string, number>;
}

const BODY_LEGEND = [
  { kind: '恒星', desc: '起点', size: 12 },
  { kind: '行星', desc: '枢纽', size: 7.6 },
  { kind: '卫星', desc: '终点', size: 5 },
];

export default function CategoryLegend({ categories, counts }: CategoryLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-1.5 text-[12.5px]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: category.color,
                boxShadow: `0 0 8px -1px ${category.color}`,
              }}
            />
            <span className="text-star-200">{category.name}</span>
            <span className="text-star-400/80">{counts.get(category.id) ?? 0}</span>
          </li>
        ))}
      </ul>

      <span className="hidden h-3.5 w-px bg-white/10 sm:block" aria-hidden="true" />

      <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        {BODY_LEGEND.map((item) => (
          <li key={item.kind} className="flex items-center gap-1.5 text-[12px]">
            <span
              aria-hidden="true"
              className="shrink-0 rounded-full bg-star-200/80"
              style={{
                width: item.size,
                height: item.size,
                boxShadow: '0 0 7px -1px rgba(216,206,240,0.8)',
              }}
            />
            <span className="text-star-300">
              {item.kind}
              <span className="text-star-400/70">·{item.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
