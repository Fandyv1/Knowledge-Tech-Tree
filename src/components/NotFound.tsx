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
    <main className="flex min-h-full items-center justify-center bg-canvas px-5 py-20">
      <div className="w-full max-w-[420px] text-center">
        <p className="text-[52px] font-semibold leading-none text-ink-400/50">404</p>
        <h1 className="mt-5 text-xl font-semibold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{detail}</p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2.5
            text-sm font-medium text-white transition-colors duration-150 hover:bg-sky-700"
        >
          <span aria-hidden="true">←</span>
          返回首页
        </Link>
      </div>
    </main>
  );
}
