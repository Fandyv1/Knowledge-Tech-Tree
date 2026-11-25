import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Category, KnowledgeNode, ResourceType } from '../types';
import { findGoalById, findNodeById } from '../data/goals';
import { buildGraphIndex, getNextSuggestion } from '../lib/graph';
import {
  STAR_DESC,
  STAR_LABEL,
  STAR_LATIN,
  getStarClass,
} from '../lib/starmap';
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
  article: 'border-paper-100/20 text-paper-200',
  video: 'border-ember-300/40 text-ember-300',
  course: 'border-ice-300/40 text-ice-300',
  book: 'border-gold-400/45 text-gold-300',
  doc: 'border-[#8FBFA0]/45 text-[#8FBFA0]',
  paper: 'border-gold-300/45 text-gold-200',
};

export default function NodeDetailPage() {
  const { goalId, nodeId } = useParams<{ goalId: string; nodeId: string }>();

  const goal = useMemo(() => findGoalById(goalId), [goalId]);
  const node = useMemo(
    () => (goal ? findNodeById(goal, nodeId) : null),
    [goal, nodeId],
  );
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
  const starClass = getStarClass(index, node.id);
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

  const archiveNo = String(goal.nodes.indexOf(node) + 1).padStart(2, '0');

  return (
    <main className="relative min-h-full pb-20">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link to={`/tree/${goal.id}`} className="btn-link">
            <span aria-hidden="true">←</span>
            返回星图
          </Link>
          <Link
            to={`/tree/${goal.id}?focus=${node.id}`}
            className="btn h-8 px-3 text-[12px]"
          >
            在星图中定位
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5">
        <header className="pb-6 pt-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="micro-strong">ARCHIVE K-{archiveNo}</span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span className="font-serif text-[12px] tracking-[0.14em] text-paper-300">
              {goal.title}
            </span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span className="mono text-[10px] tracking-[0.16em] text-paper-500">
              {STAR_LATIN[starClass]} · {STAR_LABEL[starClass]}
            </span>
          </div>

          <h1 className="display mt-4 text-[30px] leading-[1.2] sm:text-[36px]">
            {node.title}
          </h1>

          <p className="mt-3 max-w-prose72 font-serif text-[14.5px] leading-[1.9] tracking-[0.02em] text-paper-300">
            {node.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {category && (
              <span
                className="inline-flex items-center gap-2 border px-2.5 py-1 text-[11.5px]"
                style={{
                  borderColor: `${category.color}59`,
                  color: category.color,
                  backgroundColor: `${category.color}14`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rotate-45"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            )}
            <span className="inline-flex items-center gap-2 border border-white/12 px-2.5 py-1 text-[11.5px] text-paper-400">
              {STAR_DESC[starClass]}
            </span>
          </div>
        </header>

        <DependencySection
          prerequisites={prerequisites}
          successors={successors}
          goalId={goal.id}
          categoryById={categoryById}
        />

        <Section index="Ⅰ" title="概述">
          <div className="max-w-prose72 space-y-4">
            {node.description.map((paragraph, i) => (
              <p
                key={i}
                className="text-[14.5px] leading-[1.95] text-paper-200"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Section>

        <Section index="Ⅱ" title="用途 / 为什么学">
          <p className="mb-4 max-w-prose72 font-serif text-[13.5px] leading-relaxed tracking-[0.02em] text-gold-300">
            {node.why}
          </p>
          <ul className="max-w-prose72 space-y-2.5">
            {node.purposes.map((purpose) => (
              <li
                key={purpose}
                className="flex gap-3 text-[14.5px] leading-[1.9] text-paper-200"
              >
                <span
                  aria-hidden="true"
                  className="mt-[10px] h-1 w-1 shrink-0 rotate-45 bg-gold-500"
                />
                <span>{purpose}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section index="Ⅲ" title="学习路径与素材">
          {emptyResourcePrereqs.length > 0 && (
            <p className="mb-3 text-[12.5px] leading-relaxed text-paper-400">
              建议先完成前置节点：
              {emptyResourcePrereqs.map((item) => item.title).join('、')}
            </p>
          )}
          <ul>
            {node.resources.map((resource) => (
              <li key={resource.url} className="ledger-row">
                <span
                  className={`mono mt-0.5 shrink-0 border px-1.5 py-0.5 text-[9.5px]
                    tracking-[0.14em] ${RESOURCE_STYLE[resource.type]}`}
                >
                  {RESOURCE_LABEL[resource.type]}
                </span>
                <div className="min-w-0">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 font-serif
                      text-[15px] tracking-[0.02em] text-paper-100 underline-offset-4
                      transition-colors duration-150 hover:text-gold-300 hover:underline"
                  >
                    {resource.title}
                    <span
                      className="mt-1 text-[11px] text-paper-500 transition-colors
                        group-hover:text-gold-300"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </a>
                  {resource.note && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-paper-400">
                      {resource.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section index="Ⅳ" title="相关讨论 · 知乎">
          <p className="mb-3.5 max-w-prose72 text-[12.5px] leading-relaxed text-paper-400">
            本站不收录知乎内容，点击将跳转至知乎搜索结果页。
          </p>
          <div className="flex flex-wrap gap-2">
            {node.zhihuKeywords.map((keyword) => (
              <a
                key={keyword}
                href={zhihuSearchUrl(keyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="chip !h-9 !text-[12.5px]"
              >
                在知乎搜索：{keyword}
                <span className="text-paper-500" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </Section>

        <footer className="mt-10 border-t border-white/10 pt-6">
          {nextNode ? (
            <Link
              to={`/tree/${goal.id}/node/${nextNode.id}`}
              className="frame corners group flex items-center justify-between gap-4 p-4
                transition-colors duration-150 hover:bg-white/[0.03]"
            >
              <span className="min-w-0">
                <span className="micro block">NEXT IN CONSTELLATION</span>
                <span className="mt-1 block truncate font-serif text-[16px] tracking-[0.03em] text-paper-100">
                  {nextNode.title}
                </span>
              </span>
              <span
                className="shrink-0 text-gold-300 transition-transform duration-150 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ) : (
            <Link to={`/tree/${goal.id}`} className="btn">
              <span aria-hidden="true">←</span>
              返回星图
            </Link>
          )}
        </footer>
      </article>
    </main>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="archive-section">
      <div className="archive-section__head">
        <span className="archive-section__index">{index}</span>
        <h2 className="archive-section__title">{title}</h2>
      </div>
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
    <section className="border-t border-white/10 py-5">
      <div className="space-y-3">
        <DependencyRow
          label="前置知识点"
          nodes={prerequisites}
          goalId={goalId}
          categoryById={categoryById}
          emptyText="这是主星，无需前置知识，可以直接开始。"
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
      <span className="micro mr-1 w-16 shrink-0">{label}</span>
      {nodes.length === 0 ? (
        <span className="text-[13px] text-paper-400">{emptyText}</span>
      ) : (
        nodes.map((item) => {
          const color = categoryById.get(item.category)?.color ?? '#A9A496';
          return (
            <Link
              key={item.id}
              to={`/tree/${goalId}/node/${item.id}`}
              className="chip"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rotate-45"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
              />
              {item.title}
            </Link>
          );
        })
      )}
    </div>
  );
}
