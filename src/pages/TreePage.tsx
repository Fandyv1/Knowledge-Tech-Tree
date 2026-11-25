import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { findGoalById } from '../data/goals';
import { countByCategory } from '../lib/graph';
import TechTree, { type TechTreeHandle } from '../components/TechTree';
import CategoryLegend from '../components/CategoryLegend';
import NotFound from '../components/NotFound';

export default function TreePage() {
  const { goalId } = useParams<{ goalId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const goal = useMemo(() => findGoalById(goalId), [goalId]);

  // fromSearch 只消费一次：读入后立即清除 history state，
  // 这样刷新与浏览器后退都不会重放入场动画。
  const [playEntrance] = useState(() => {
    const state = location.state as { fromSearch?: boolean } | null;
    return state?.fromSearch === true;
  });

  useEffect(() => {
    const state = location.state as { fromSearch?: boolean } | null;
    if (state?.fromSearch) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
    // 仅在挂载后执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRef = useRef<TechTreeHandle | null>(null);
  const onReady = useCallback((handle: TechTreeHandle) => {
    handleRef.current = handle;
  }, []);

  const onOpenNode = useCallback(
    (nodeId: string) => {
      navigate(`/tree/${goalId}/node/${nodeId}`);
    },
    [goalId, navigate],
  );

  if (!goal) {
    return (
      <NotFound
        title="没有找到这个学习目标"
        detail={`路由参数 ${goalId ?? '(空)'} 不在内置知识库中。`}
      />
    );
  }

  const counts = countByCategory(goal);
  const focusNodeId = searchParams.get('focus');
  const edgeCount = goal.nodes.reduce(
    (total, node) => total + node.prerequisites.length,
    0,
  );

  return (
    <main className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/10 bg-ink-950/72 backdrop-blur-md">
        <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-4 px-4 pb-3 pt-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="micro">CONSTELLATION</span>
              <span className="h-px w-8 bg-white/15" aria-hidden="true" />
              <span className="micro">{goal.id.toUpperCase()}</span>
            </div>
            <h1 className="display mt-1.5 truncate text-[22px] sm:text-[27px]">
              {goal.title}
            </h1>
            <p className="mt-1 line-clamp-2 max-w-[62ch] text-[12.5px] leading-relaxed text-paper-400 sm:truncate">
              {goal.subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              className="flex items-center"
              role="group"
              aria-label="画布缩放"
            >
              <button
                type="button"
                className="btn btn-square border-r-0"
                title="放大"
                aria-label="放大"
                onClick={() => handleRef.current?.zoomIn()}
              >
                +
              </button>
              <button
                type="button"
                className="btn btn-square border-r-0"
                title="缩小"
                aria-label="缩小"
                onClick={() => handleRef.current?.zoomOut()}
              >
                −
              </button>
              <button
                type="button"
                className="btn btn-square border-r-0"
                title="适应画布"
                aria-label="适应画布"
                onClick={() => handleRef.current?.fitView()}
              >
                ⤢
              </button>
              <button
                type="button"
                className="btn btn-square"
                title="重置视图"
                aria-label="重置视图"
                onClick={() => handleRef.current?.reset()}
              >
                ↺
              </button>
            </div>

            <span className="mx-1 hidden h-6 w-px bg-white/12 sm:block" aria-hidden="true" />

            <Link to="/" className="btn">
              重新搜索
            </Link>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/[0.06] px-4 py-2 sm:px-6">
          <CategoryLegend categories={goal.categories} counts={counts} />
          <p className="mono hidden text-[10px] tracking-[0.16em] text-paper-500 sm:block">
            {String(goal.nodes.length).padStart(2, '0')} STARS /{' '}
            {String(edgeCount).padStart(2, '0')} LINKS · 本地知识库
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <TechTree
          goal={goal}
          playEntrance={playEntrance}
          focusNodeId={focusNodeId}
          onOpenNode={onOpenNode}
          onReady={onReady}
        />
      </div>
    </main>
  );
}
