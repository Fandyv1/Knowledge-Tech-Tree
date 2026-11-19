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

  return (
    <main className="flex h-full flex-col bg-canvas">
      <header className="shrink-0 border-b border-line bg-white/90 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-ink-900">
              {goal.title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-ink-500">{goal.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="icon-button"
                title="放大"
                aria-label="放大"
                onClick={() => handleRef.current?.zoomIn()}
              >
                +
              </button>
              <button
                type="button"
                className="icon-button"
                title="缩小"
                aria-label="缩小"
                onClick={() => handleRef.current?.zoomOut()}
              >
                −
              </button>
              <button
                type="button"
                className="icon-button"
                title="适应画布"
                aria-label="适应画布"
                onClick={() => handleRef.current?.fitView()}
              >
                ⤢
              </button>
              <button
                type="button"
                className="icon-button"
                title="重置视图"
                aria-label="重置视图"
                onClick={() => handleRef.current?.reset()}
              >
                ↺
              </button>
            </div>

            <Link to="/" className="ghost-button">
              重新搜索
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 sm:px-6">
          <CategoryLegend categories={goal.categories} counts={counts} />
          <p className="text-[11.5px] text-ink-400">
            分析基于本地预设知识库，未调用大模型
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
