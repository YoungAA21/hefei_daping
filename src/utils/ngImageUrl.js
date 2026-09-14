// NG files are served by the same backend as the list API. Route them through
// the frontend server so LAN clients do not need access to the backend origin.
export function resolveNgImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const source = value.trim();
  try {
    const url = new URL(source, 'http://ng-image.local/');
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (url.pathname.startsWith('/ngimages/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    // Do not rewrite unrelated asset services or external image paths.
    return source;
  } catch {
    return '';
  }
}
