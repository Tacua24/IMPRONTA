// src/auth.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("impronta:user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  function register({ nombre, email, password, rol = "usuario" }) {
    const u = {
      id: crypto.randomUUID(),
      full_name: nombre,
      email,
      password_hash: `mock:${password}`, // MOCK
      role: rol,                         // "usuario" | "artista" | "admin"
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`impronta:user:${email}`, JSON.stringify(u)); // índice para login
    localStorage.setItem("impronta:user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  function login({ email, password }) {
    const raw = localStorage.getItem(`impronta:user:${email}`);
    if (!raw) throw new Error("Usuario no encontrado.");
    const u = JSON.parse(raw);
    if (u.password_hash !== `mock:${password}`) throw new Error("Contraseña incorrecta.");
    localStorage.setItem("impronta:user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem("impronta:user");
    setUser(null);
  }

  // ====== MOCK tabla artists (perfil 1:1) ======
  function artistProfileOf(userId) {
    const raw = localStorage.getItem(`impronta:artist:${userId}`);
    return raw ? JSON.parse(raw) : null;
  }

  function upsertArtistProfile(userId, profile) {
    // Guarda/actualiza como si fuera INSERT/UPDATE en tabla artists
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
      verified: 0, // esto lo manejaría un admin real
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(`impronta:artist:${userId}`, JSON.stringify(toSave));
    return toSave;
  }

  return (
    <AuthCtx.Provider value={{ user, register, login, logout, artistProfileOf, upsertArtistProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

