// The only deployable game lives in public/. Never route to archived/root builds.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Historical links to the repository-style /public/ path must resolve to
    // the same production asset instead of becoming another game entry point.
    if (url.pathname === '/public' || url.pathname.startsWith('/public/')) {
      const path = url.pathname === '/public' ? '/' : url.pathname.slice('/public'.length);
      return Response.redirect(new URL(path + url.search, url.origin), 308);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Myrren-Entry', 'canonical-public');

    // HTML, scripts, styles and manifests must move together after deployment.
    // Avoid split-version sessions when users reopen links inside in-app browsers.
    const path = url.pathname;
    if (path === '/' || /\\.(?:html|js|css|json)$/i.test(path)) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      headers.set('CDN-Cache-Control', 'no-store');
      headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
