import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, registerUser } from "./services/api.js";

const AuthCtx = createContext(null);
const AUTH_STORAGE_KEY = "impronta:auth";
const ROLE_INDEX_KEY = "impronta:role-index";
const ARTIST_KEY_PREFIX = "impronta:artist:";

export const useAuth = () => useContext(AuthCtx);

function readStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { token: null, user: null };

try {
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed.token === "string" ? parsed.token : null,
      user: parsed.user && typeof parsed.user === "object" ? parsed.user : null,
    };
} catch (error) {
    console.warn("No se pudo leer la sesión guardada:", error);
    return { token: null, user: null };
  }
}

function persistAuth(token, user) {
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

const payload = { token };
  if (user) payload.user = user;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

function readRole(email) {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  if (!key) return null;

  const raw = localStorage.getItem(ROLE_INDEX_KEY);
  if (!raw) return null;

  try {
    const map = JSON.parse(raw);
    return map[key] ?? null;
  } catch (error) {
    console.warn("No se pudo leer el índice de roles:", error);
    return null;
  }
}

function persistRole(email, role) {
  if (!email || !role) return;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;
  const raw = localStorage.getItem(ROLE_INDEX_KEY);

  let map = {};
  if (raw) {
    try {
      map = JSON.parse(raw) ?? {};
    } catch (error) {
      console.warn("No se pudo parsear el índice de roles, se reiniciará.", error);
    }
  }

map[normalizedEmail] = role;
  localStorage.setItem(ROLE_INDEX_KEY, JSON.stringify(map));
}

function normalizeUser(apiUser, role = "usuario", fallbackName = "") {
  if (!apiUser) return null;
  const safeRole = role || "usuario";
  const resolvedName = (apiUser.name ?? fallbackName ?? "").trim();

  return {
    id: apiUser.id,
    email: apiUser.email,
    name: resolvedName,
    full_name: resolvedName,
    role: safeRole,
    status: "active",
    created_at: apiUser.createdAt ?? null,
    updated_at: apiUser.updatedAt ?? null,
  };
}

function artistProfileKey(userId) {
  return `${ARTIST_KEY_PREFIX}${userId}`;
}

export function AuthProvider({ children }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [isBootstrapping, setBootstrapping] = useState(Boolean(stored.token) && !stored.user);

  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      setUser(null);
      return;
    }

    let active = true;
    const shouldShowLoader = !user;

    async function syncSession() {
      if (shouldShowLoader) {
        setBootstrapping(true);
      }
      try {
        const response = await getCurrentUser(token);
        const apiUser = response?.user;
        if (!active) return;
        if (!apiUser) {
          throw new Error("La API no devolvió información de usuario.");
        }

        const storedRole = readRole(apiUser.email) ?? user?.role ?? "usuario";
        const normalized = normalizeUser(apiUser, storedRole, user?.full_name);
        setUser(normalized);
        persistAuth(token, normalized);
      } catch (error) {
        console.error("No se pudo sincronizar la sesión:", error);
        if (!active) return;
        setToken(null);
        setUser(null);
        persistAuth(null, null);
      } finally {
        if (active) setBootstrapping(false);
      }
    }

    syncSession();
    return () => {
      active = false;
    };
    }, [token]);

  const register = useMemo(() => {
    return async function registerUserWithApi({ nombre, email, password, rol = "usuario" }) {
      const trimmedEmail = typeof email === "string" ? email.trim() : "";
      const trimmedPassword = typeof password === "string" ? password : "";
      const trimmedName = typeof nombre === "string" ? nombre.trim() : "";

      const payload = {
        email: trimmedEmail,
        password: trimmedPassword,
        name: trimmedName || null,
      };

      const response = await registerUser(payload);
      const apiUser = response?.user;
      if (!response?.token || !apiUser) {
        throw new Error("Registro incompleto: falta token o datos de usuario.");
      }

      persistRole(trimmedEmail, rol);
      const normalized = normalizeUser(apiUser, rol, nombre);
      setToken(response.token);
      setUser(normalized);
      persistAuth(response.token, normalized);
      return normalized;
    };
  }, []);

  const login = useMemo(() => {
    return async function loginUserWithApi({ email, password }) {
      const trimmedEmail = typeof email === "string" ? email.trim() : "";
      const response = await loginUser({ email: trimmedEmail, password });
      const apiUser = response?.user;
      if (!response?.token || !apiUser) {
        throw new Error("Inicio de sesión incompleto: falta token o datos de usuario.");
      }

      const role = readRole(trimmedEmail) ?? "usuario";
      const normalized = normalizeUser(apiUser, role);
      setToken(response.token);
      setUser(normalized);
      persistAuth(response.token, normalized);
      return normalized;
    };
  }, []);

  const logout = useMemo(() => {
    return function logoutUser() {
      setToken(null);
      setUser(null);
      setBootstrapping(false);
      persistAuth(null, null);
    };
  }, []);

  const upsertArtistProfile = useMemo(() => {
    return function upsert(userId, profile) {
      if (!userId) throw new Error("Falta el identificador del usuario.");
      const key = artistProfileKey(userId);
      const toSave = {
        id: userId,
        stage_name: profile.stage_name || "",
        bio: profile.bio || "",
        country: profile.country || "",
        city: profile.city || "",
        birth_year: profile.birth_year || "",
        death_year: profile.death_year || "",
        website: profile.website || "",
        instagram: profile.instagram || "",
        verified: 0,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(toSave));
      return toSave;
    };
  }, []);

  const artistProfileOf = useMemo(() => {
    return function artistProfile(userId) {
      const key = artistProfileKey(userId);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    };
  }, []);
    const value = useMemo(
    () => ({
      user,
      token,
      loading: isBootstrapping,
      register,
      login,
      logout,
      upsertArtistProfile,
      artistProfileOf,
    }),
    [artistProfileOf, isBootstrapping, login, logout, register, token, upsertArtistProfile, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
