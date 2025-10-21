function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === "string") {
    const trimmed = fromEnv.trim();
    if (trimmed) {
      return trimmed.replace(/\/$/, "");
    }
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
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

