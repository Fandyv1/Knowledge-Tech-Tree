/** 知乎搜索 URL 拼接。不抓取、不代理、不内嵌，仅跳转。 */
export const zhihuSearchUrl = (kw: string): string =>
  `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(kw)}`;
