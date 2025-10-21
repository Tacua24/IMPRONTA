function stripTrailingSlash(url) {
  return url.replace(/\/$/, "");
}

function resolveApiBaseUrl() {
  const env = import.meta.env ?? {};

  const fromEnv = env.VITE_API_BASE_URL;
  if (typeof fromEnv === "string") {
    const trimmed = fromEnv.trim();
    if (trimmed) {
      return stripTrailingSlash(trimmed);
    }
  }

  const hostFromEnv = env.VITE_API_HOST;
  const portFromEnv = env.VITE_API_PORT ?? env.VITE_BACKEND_PORT;
  const protocolFromEnv = env.VITE_API_PROTOCOL;

  if (hostFromEnv || portFromEnv || protocolFromEnv) {
    const rawHost = typeof hostFromEnv === "string" ? hostFromEnv.trim() : "";
    if (rawHost && /:\/\//.test(rawHost)) {
      return stripTrailingSlash(rawHost);
    }

    const defaultHost =
      rawHost || (typeof window !== "undefined" && window.location?.hostname) || "localhost";
    const protocol =
      (typeof protocolFromEnv === "string" ? protocolFromEnv.trim().replace(/:$/, "") : "") ||
      (typeof window !== "undefined" && window.location?.protocol?.replace(/:$/, "")) ||
      "http";
    const port =
      typeof portFromEnv === "string" || typeof portFromEnv === "number"
        ? String(portFromEnv).trim().replace(/^:/, "")
        : "";

    const portSegment = port ? `:${port}` : "";
    return `${protocol}://${defaultHost}${portSegment}`;
  }

  if (env.DEV) {
    const hostname =
      (typeof window !== "undefined" && window.location?.hostname) || "localhost";
    const protocol =
      (typeof window !== "undefined" && window.location?.protocol?.replace(/:$/, "")) ||
      "http";
    const candidatePort = env.VITE_DEV_API_PORT || "4000";
    const port = String(candidatePort).trim().replace(/^:/, "");
    const portSegment = port ? `:${port}` : "";
    return `${protocol}://${hostname}${portSegment}`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return "";
}

const API_BASE_URL = resolveApiBaseUrl();

function buildUrl(path) {
  if (!path) return API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function apiFetch(path, { headers = {}, body, ...options } = {}) {
  const url = buildUrl(path);
  const config = { ...options };
  const finalHeaders = new Headers({ Accept: "application/json", ...headers });

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
    config.body = JSON.stringify(body);
  } else {
    config.body = body;
  }

  config.headers = finalHeaders;

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${payload?.error || response.statusText}`);
  }

  return payload;
}

export { apiFetch, buildUrl };

