import { Link } from 'react-router-dom';

interface NotFoundProps {
  title?: string;
  detail?: string;
}

export default function NotFound({
  title = '页面不存在',
  detail = '你访问的地址没有对应内容，可能是链接有误。',
}: NotFoundProps) {
  return (
    <main className="relative flex min-h-full items-center justify-center px-5 py-20">
      <div className="w-full max-w-[460px]">
        <div className="flex items-center gap-3">
          <span className="micro-strong">SIGNAL LOST</span>
          <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
          <span className="micro">NO COORDINATE</span>
        </div>

        <p className="display mt-7 text-[72px] leading-none tracking-[0.12em] text-paper-100">
          404
        </p>

        <div className="rule-diamond my-6" aria-hidden="true">
          <span />
        </div>

        <h1 className="font-serif text-[22px] tracking-[0.06em] text-paper-100">
          {title}
        </h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-paper-400">
          {detail}
        </p>

        <Link to="/" className="btn btn-gold mt-8">
          <span aria-hidden="true">←</span>
          返回首页
        </Link>
      </div>
    </main>
  );
}
