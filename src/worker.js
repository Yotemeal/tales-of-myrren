export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    // Do not let browsers or the Cloudflare edge keep an old game shell.
    const isGameDocument =
      url.pathname === "/" ||
      url.pathname === "/index.html" ||
      url.pathname.endsWith(".html");

    if (!isGameDocument) return response;

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
