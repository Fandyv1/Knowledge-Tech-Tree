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
      <div className="w-full max-w-[440px] text-center">
        <p
          className="bg-clip-text text-[64px] font-semibold leading-none text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(216,206,240,0.5), rgba(124,58,237,0.65))',
          }}
        >
          404
        </p>
        <h1 className="mt-5 text-xl font-semibold text-star-100">{title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-star-400">{detail}</p>
        <Link to="/" className="primary-button mt-8 py-2.5">
          <span aria-hidden="true">←</span>
          返回首页
        </Link>
      </div>
    </main>
  );
}
