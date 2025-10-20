const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload) ||
      response.statusText ||
      "Error al comunicarse con la API";
    throw new Error(message);
  }

  return payload;
}

export async function registerUser(data) {
  return apiFetch("/auth/register", { method: "POST", body: data });
}

export async function loginUser(data) {
  return apiFetch("/auth/login", { method: "POST", body: data });
}

export async function upsertArtistProfile(userId, profile, token) {
  if (!userId) throw new Error("Falta el identificador del usuario.");
  return apiFetch(`/artists/${userId}`, {
    method: "PUT",
    body: profile,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function getArtistProfile(userId, token) {
  if (!userId) throw new Error("Falta el identificador del usuario.");
  return apiFetch(`/artists/${userId}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function getCurrentUser(token) {
  if (!token) throw new Error("Falta el token de autenticación.");
  return apiFetch("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}
