import type { Category } from '../types';

interface CategoryLegendProps {
  categories: Category[];
  counts: Map<string, number>;
}

export default function CategoryLegend({ categories, counts }: CategoryLegendProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {categories.map((category) => (
        <li key={category.id} className="flex items-center gap-1.5 text-[12.5px]">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-ink-700">{category.name}</span>
          <span className="text-ink-400">{counts.get(category.id) ?? 0}</span>
        </li>
      ))}
    </ul>
  );
}
