import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Category, KnowledgeNode, ResourceType } from '../types';
import { findGoalById, findNodeById } from '../data/goals';
import { buildGraphIndex, getNextSuggestion } from '../lib/graph';
import { zhihuSearchUrl } from '../lib/zhihu';
import NotFound from '../components/NotFound';

const RESOURCE_LABEL: Record<ResourceType, string> = {
  article: '文章',
  video: '视频',
  course: '课程',
  book: '书籍',
  doc: '文档',
  paper: '论文',
};

const RESOURCE_STYLE: Record<ResourceType, string> = {
  article: 'bg-slate-100 text-slate-600',
  video: 'bg-rose-50 text-rose-600',
  course: 'bg-sky-50 text-sky-700',
  book: 'bg-amber-50 text-amber-700',
  doc: 'bg-emerald-50 text-emerald-700',
  paper: 'bg-violet-50 text-violet-700',
};

export default function NodeDetailPage() {
  const { goalId, nodeId } = useParams<{ goalId: string; nodeId: string }>();

  const goal = useMemo(() => findGoalById(goalId), [goalId]);
  const node = useMemo(() => (goal ? findNodeById(goal, nodeId) : null), [goal, nodeId]);
  const index = useMemo(() => (goal ? buildGraphIndex(goal) : null), [goal]);

  if (!goal) {
    return (
      <NotFound
        title="没有找到这个学习目标"
        detail={`路由参数 ${goalId ?? '(空)'} 不在内置知识库中。`}
      />
    );
  }

  if (!node || !index) {
    return (
      <NotFound
        title="没有找到这个知识点"
        detail={`「${goal.title}」中不存在 id 为 ${nodeId ?? '(空)'} 的知识点。`}
      />
    );
  }

  const categoryById = new Map(goal.categories.map((item) => [item.id, item]));
  const category = categoryById.get(node.category);
  const prerequisites = (index.prerequisites.get(node.id) ?? [])
    .map((id) => index.byId.get(id))
    .filter((item): item is KnowledgeNode => Boolean(item));
  const successors = (index.successors.get(node.id) ?? [])
    .map((id) => index.byId.get(id))
    .filter((item): item is KnowledgeNode => Boolean(item));
  const nextNode = getNextSuggestion(index, node.id);
  const emptyResourcePrereqs = prerequisites.filter(
    (item) => item.resources.length === 0,
  );

  return (
    <main className="min-h-full bg-canvas pb-20">
      <div className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link
            to={`/tree/${goal.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-700
              transition-colors duration-150 hover:text-sky-700"
          >
            <span aria-hidden="true">←</span>
            返回科技树
          </Link>
          <Link
            to={`/tree/${goal.id}?focus=${node.id}`}
            className="ghost-button text-[13px]"
          >
            在科技树中查看
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5">
        <header className="pb-6 pt-8">
          {category && (
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium"
              style={{ backgroundColor: category.colorSoft, color: category.color }}
            >
              {category.name}
            </span>
          )}
          <h1 className="mt-3 text-[26px] font-semibold leading-tight text-ink-900">
            {node.title}
          </h1>
          <p className="mt-2 max-w-prose72 text-[15px] leading-relaxed text-ink-500">
            {node.summary}
          </p>
        </header>

        <DependencySection
          prerequisites={prerequisites}
          successors={successors}
          goalId={goal.id}
          categoryById={categoryById}
        />

        <Section title="概述">
          <div className="max-w-prose72 space-y-3.5">
            {node.description.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-[1.7] text-ink-700">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>

        <Section title="用途 / 为什么学">
          <p className="mb-3 max-w-prose72 text-[14px] leading-relaxed text-ink-500">
            {node.why}
          </p>
          <ul className="max-w-prose72 space-y-2">
            {node.purposes.map((purpose) => (
              <li key={purpose} className="flex gap-2 text-[15px] leading-[1.7] text-ink-700">
                <span className="mt-[2px] shrink-0 text-sky-600" aria-hidden="true">
                  ▸
                </span>
                <span>{purpose}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="学习路径与素材">
          {emptyResourcePrereqs.length > 0 && (
            <p className="mb-3 text-[13.5px] text-ink-500">
              建议先完成前置节点：
              {emptyResourcePrereqs.map((item) => item.title).join('、')}
            </p>
          )}
          <ul className="space-y-2.5">
            {node.resources.map((resource) => (
              <li key={resource.url} className="surface-card p-4">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium
                      ${RESOURCE_STYLE[resource.type]}`}
                  >
                    {RESOURCE_LABEL[resource.type]}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] font-medium text-ink-900 underline-offset-4
                        transition-colors duration-150 hover:text-sky-700 hover:underline"
                    >
                      {resource.title}
                      <span className="ml-1 text-[12px] text-ink-400" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                    {resource.note && (
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                        {resource.note}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="相关讨论（知乎）">
          <p className="mb-3.5 max-w-prose72 text-[13.5px] leading-relaxed text-ink-500">
            本站不收录知乎内容，点击将跳转至知乎搜索结果页。
          </p>
          <div className="flex flex-wrap gap-2">
            {node.zhihuKeywords.map((keyword) => (
              <a
                key={keyword}
                href={zhihuSearchUrl(keyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line
                  bg-white px-3.5 py-2 text-[13.5px] text-ink-700 transition-colors
                  duration-150 hover:border-sky-300 hover:text-sky-700"
              >
                在知乎搜索：{keyword}
                <span className="text-ink-400" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </Section>

        <footer className="mt-10 border-t border-line pt-6">
          {nextNode ? (
            <Link
              to={`/tree/${goal.id}/node/${nextNode.id}`}
              className="surface-card flex items-center justify-between gap-3 p-4
                transition-colors duration-150 hover:border-sky-300"
            >
              <span className="min-w-0">
                <span className="block text-[12px] text-ink-400">继续学习</span>
                <span className="mt-0.5 block truncate text-[15px] font-medium text-ink-900">
                  {nextNode.title}
                </span>
              </span>
              <span className="shrink-0 text-sky-600" aria-hidden="true">
                →
              </span>
            </Link>
          ) : (
            <Link to={`/tree/${goal.id}`} className="ghost-button">
              <span aria-hidden="true">←</span>
              返回科技树
            </Link>
          )}
        </footer>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7">
      <h2 className="mb-3.5 text-[13px] font-semibold uppercase tracking-wide text-ink-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface DependencySectionProps {
  prerequisites: KnowledgeNode[];
  successors: KnowledgeNode[];
  goalId: string;
  categoryById: Map<string, Category>;
}

function DependencySection({
  prerequisites,
  successors,
  goalId,
  categoryById,
}: DependencySectionProps) {
  return (
    <section className="border-t border-line py-6">
      <div className="space-y-3.5">
        <DependencyRow
          label="前置知识点"
          nodes={prerequisites}
          goalId={goalId}
          categoryById={categoryById}
          emptyText="这是一棵树的起点，可以直接开始。"
        />
        {successors.length > 0 && (
          <DependencyRow
            label="后续知识点"
            nodes={successors}
            goalId={goalId}
            categoryById={categoryById}
          />
        )}
      </div>
    </section>
  );
}

function DependencyRow({
  label,
  nodes,
  goalId,
  categoryById,
  emptyText,
}: {
  label: string;
  nodes: KnowledgeNode[];
  goalId: string;
  categoryById: Map<string, Category>;
  emptyText?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] text-ink-400">{label}</span>
      {nodes.length === 0 ? (
        <span className="text-[13.5px] text-ink-500">{emptyText}</span>
      ) : (
        nodes.map((item) => {
          const color = categoryById.get(item.category)?.color ?? '#94A3B8';
          return (
            <Link
              key={item.id}
              to={`/tree/${goalId}/node/${item.id}`}
              className="pill-button text-[13px]"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              {item.title}
            </Link>
          );
        })
      )}
    </div>
  );
}
