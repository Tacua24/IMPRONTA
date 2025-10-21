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

const USERS_KEY = "impronta:api:users";
const SESSIONS_KEY = "impronta:api:sessions";

const memoryStore = {
  users: [],
  sessions: {},
};

function getLocalStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    console.warn("LocalStorage no disponible:", error);
  }
  return null;
}

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn("No se pudo parsear JSON almacenado:", error);
    return fallback;
  }
}

function readUsers() {
  const storage = getLocalStorage();
  if (!storage) return memoryStore.users;
  const data = parseJson(storage.getItem(USERS_KEY), []);
  if (!Array.isArray(data)) return [];
  return data;
}

function persistUsers(users) {
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(USERS_KEY, JSON.stringify(users));
  }
  memoryStore.users = users;
}

function readSessions() {
  const storage = getLocalStorage();
  if (!storage) return { ...memoryStore.sessions };
  const data = parseJson(storage.getItem(SESSIONS_KEY), {});
  return typeof data === "object" && data ? data : {};
}

function persistSessions(sessions) {
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  memoryStore.sessions = sessions;
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user-${Math.random().toString(36).slice(2, 11)}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...rest } = user;
  return rest;
}

async function registerUser(payload) {
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  const fullName = typeof payload?.full_name === "string" ? payload.full_name.trim() : "";
  const role = typeof payload?.role === "string" ? payload.role : "visitor";

  if (!email || !password) {
    throw new Error("El correo y la contraseña son obligatorios.");
  }

  const users = readUsers();
  const exists = users.some((user) => user.email === email);
  if (exists) {
    throw new Error("Ya existe una cuenta registrada con este correo electrónico.");
  }

  const now = new Date().toISOString();
  const user = {
    id: generateId(),
    email,
    password,
    full_name: fullName,
    name: fullName,
    role,
    createdAt: now,
    updatedAt: now,
  };

  const nextUsers = [...users, user];
  persistUsers(nextUsers);

  const token = `local-${user.id}`;
  const sessions = readSessions();
  sessions[token] = { userId: user.id, createdAt: now };
  persistSessions(sessions);

  return { token, user: sanitizeUser(user) };
}

async function loginUser(payload) {
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!email || !password) {
    throw new Error("Credenciales incompletas.");
  }

  const users = readUsers();
  const user = users.find((item) => item.email === email);
  if (!user || user.password !== password) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  const token = `local-${user.id}`;
  const sessions = readSessions();
  sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
  persistSessions(sessions);

  return { token, user: sanitizeUser(user) };
}

async function getCurrentUser(token) {
  const value = typeof token === "string" ? token.trim() : "";
  if (!value) {
    throw new Error("Token de sesión no válido.");
  }

  const sessions = readSessions();
  const session = sessions[value];
  if (!session) {
    throw new Error("Sesión expirada o inexistente.");
  }

  const users = readUsers();
  const user = users.find((item) => item.id === session.userId);
  if (!user) {
    throw new Error("Usuario asociado a la sesión no encontrado.");
  }

  return { token: value, user: sanitizeUser(user) };
}

export { apiFetch, buildUrl, getCurrentUser, loginUser, registerUser };
