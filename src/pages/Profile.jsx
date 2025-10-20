// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function Profile() {
  const { user, register, login, logout, upsertArtistProfile, artistProfileOf } = useAuth();
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [err, setErr] = useState("");

  // form base
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario", // "usuario" | "artista"
  });

  // form de artista (solo cuando rol === 'artista')
  const [artist, setArtist] = useState({
    stage_name: "",
    bio: "",
    country: "",
    city: "",
    birth_year: "",
    death_year: "",
    website: "",
    instagram: "",
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "register") {
        const u = register(form);
        if (u.role === "artista") {
          upsertArtistProfile(u.id, artist); // guarda perfil 1:1 (mock de tabla artists)
        }
      } else {
        const u = login({ email: form.email, password: form.password });
        // si es artista, podrías cargar artist profile luego con artistProfileOf(u.id)
      }
    } catch (e) {
      setErr(e.message || "Error");
    }
  };

  // ====== SIN SESIÓN: login/registro centrado ======
  if (!user) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6 sm:px-10 py-16">
        <div className="w-full max-w-xl">
          <h1 className="text-lg font-semibold mb-2 text-center">Perfil</h1>
          <p className="text-sm text-neutral-700 mb-8 text-center">
            Crea tu cuenta o inicia sesión para guardar favoritos, enviar solicitudes y (si eres artista) subir obras.
          </p>

          {/* Cambiar modo */}
          <div className="mb-4 flex justify-center gap-2 text-xs uppercase tracking-widest">
            <button
              className={`px-3 py-1 rounded ${mode === "register" ? "bg-black text-white" : "bg-black/5"}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Crear cuenta
            </button>
            <button
              className={`px-3 py-1 rounded ${mode === "login" ? "bg-black text-white" : "bg-black/5"}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Iniciar sesión
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-sm bg-white/70 p-6 rounded-2xl border border-black/10">
            {mode === "register" && (
              <div>
                <label className="block mb-1">Nombre completo</label>
                <input
                  className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {mode === "register" && (
              <>
                {/* Rol */}
                <fieldset className="border border-black/10 rounded p-3">
                  <legend className="text-[11px] uppercase tracking-widest text-neutral-700">Tipo de cuenta</legend>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rol"
                        value="usuario"
                        checked={form.rol === "usuario"}
                        onChange={(e) => setForm({ ...form, rol: e.target.value })}
                      />
                      Visitante / usuario
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rol"
                        value="artista"
                        checked={form.rol === "artista"}
                        onChange={(e) => setForm({ ...form, rol: e.target.value })}
                      />
                      Artista
                    </label>
                  </div>
                </fieldset>

                {/* Campos extra de ARTISTA (se muestran solo si rol=artista) */}
                {form.rol === "artista" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/[0.03] p-4 rounded-xl">
                    <div className="sm:col-span-2">
                      <label className="block mb-1">Nombre artístico</label>
                      <input
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.stage_name}
                        onChange={(e) => setArtist({ ...artist, stage_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">País</label>
                      <input
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.country}
                        onChange={(e) => setArtist({ ...artist, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Ciudad</label>
                      <input
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.city}
                        onChange={(e) => setArtist({ ...artist, city: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Año de nacimiento</label>
                      <input
                        type="number"
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.birth_year}
                        onChange={(e) => setArtist({ ...artist, birth_year: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Año de fallecimiento (opc)</label>
                      <input
                        type="number"
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.death_year}
                        onChange={(e) => setArtist({ ...artist, death_year: e.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block mb-1">Sitio web</label>
                      <input
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.website}
                        onChange={(e) => setArtist({ ...artist, website: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1">Instagram</label>
                      <input
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.instagram}
                        onChange={(e) => setArtist({ ...artist, instagram: e.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block mb-1">Bio</label>
                      <textarea
                        rows={3}
                        className="w-full border border-black/20 rounded px-3 py-2 outline-none"
                        value={artist.bio}
                        onChange={(e) => setArtist({ ...artist, bio: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {err && <div className="text-red-600">{err}</div>}

            <button type="submit" className="w-full px-4 py-2 rounded bg-black text-white">
              {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ====== CON SESIÓN: mostrar perfil (y si es artista, su ficha) ======
  const ap = user.role === "artista" ? artistProfileOf(user.id) : null;

  return (
    <main className="px-6 sm:px-10 py-16">
      <h1 className="text-lg font-semibold mb-6">Perfil</h1>

      <div className="grid gap-6 max-w-4xl">
        <div className="bg-white/70 border border-black/10 rounded-xl p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-neutral-500">Nombre</dt><dd className="font-medium">{user.full_name}</dd></div>
            <div><dt className="text-neutral-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
            <div><dt className="text-neutral-500">Rol</dt><dd className="font-medium capitalize">{user.role}</dd></div>
            <div><dt className="text-neutral-500">Estado</dt><dd className="font-medium">{user.status}</dd></div>
          </dl>
          <div className="mt-6"><button onClick={logout} className="px-3 py-2 rounded bg-black text-white text-sm">Salir</button></div>
        </div>

        {ap && (
          <div className="bg-white/70 border border-black/10 rounded-xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-neutral-700 mb-4">Perfil de artista</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-neutral-500">Nombre artístico</dt><dd className="font-medium">{ap.stage_name || "—"}</dd></div>
              <div><dt className="text-neutral-500">Ubicación</dt><dd className="font-medium">{[ap.city, ap.country].filter(Boolean).join(", ") || "—"}</dd></div>
              <div><dt className="text-neutral-500">Años</dt><dd className="font-medium">{ap.birth_year || "—"} {ap.death_year ? `– ${ap.death_year}` : ""}</dd></div>
              <div><dt className="text-neutral-500">Instagram</dt><dd className="font-medium">{ap.instagram || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-neutral-500">Bio</dt><dd className="font-medium">{ap.bio || "—"}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </main>
  );
}


