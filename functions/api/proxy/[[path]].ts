export const onRequest = async (context: { request: Request }): Promise<Response> => {
  const { request } = context;
  
  // CORS Preflight support for incoming calls to the proxy
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-target-url, accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  let targetUrlStr = request.headers.get("x-target-url");
  if (!targetUrlStr) {
    const workerBase = "https://automanager-backend.juanalmiron529.workers.dev";
    const url = new URL(request.url);
    const subpath = url.pathname.replace(/^\/api\/proxy/, "");
    const normalizedSubpath = subpath.startsWith("/") ? subpath : "/" + subpath;
    targetUrlStr = `${workerBase}${normalizedSubpath}${url.search}`;
  }

  try {
    const targetUrl = new URL(targetUrlStr);
    
    // Safety allowlist for preventing open proxy exploitation
    const allowedDomain = "juanalmiron529.workers.dev";
    const isAllowed = targetUrl.hostname === allowedDomain || targetUrl.hostname.endsWith("." + allowedDomain);
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Dominio destino no autorizado para el Proxy CORS." }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // Copy relevant headers to forward
    const headers = new Headers();
    const headersToForward = ['authorization', 'content-type', 'accept', 'user-agent'];
    for (const h of headersToForward) {
      const val = request.headers.get(h);
      if (val) {
        headers.set(h, val);
      }
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward the request body for writes
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      // In Cloudflare Workers/Pages runtime, we can pass request.body directly as a ReadableStream
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrlStr, fetchOptions);

    // Build the response headers with required CORS permissions
    const resHeaders = new Headers();
    const resHeadersToForward = ['content-type', 'cache-control'];
    for (const h of resHeadersToForward) {
      const val = response.headers.get(h);
      if (val) {
        resHeaders.set(h, val);
      }
    }

    // Force CORS permissions on response
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-target-url, accept");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: `Error de Proxy en Cloudflare Pages Function: No se pudo conectar con el backend externo. Detalle: ${err.message || String(err)}`
    }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
};
