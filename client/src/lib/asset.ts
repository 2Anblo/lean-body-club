/**
 * The site may be served from a sub-path (GitHub Pages: /lean-body-club/).
 * Vite exposes that as BASE_URL ("/" locally). Root-relative paths like
 * "/images/x.jpg" are rewritten under it; full URLs are left alone.
 */
export const BASE_URL = import.meta.env.BASE_URL;

export function assetUrl(url: string): string {
  if (/^(https?:|data:|blob:|\/\/)/.test(url)) return url;
  return BASE_URL + url.replace(/^\/+/, '');
}

/** React Router basename: "/lean-body-club" on Pages, undefined locally. */
export const ROUTER_BASENAME = BASE_URL.replace(/\/+$/, '') || undefined;
