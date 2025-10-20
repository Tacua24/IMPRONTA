import { useEffect, useRef, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Favorites from "./pages/Favorites.jsx";
import Requests from "./pages/Requests.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, [open]);

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111] overflow-x-hidden">
      {/* BARRA SUPERIOR SENCILLA */}
      <div className="w-full text-[10px] uppercase tracking-wide text-neutral-600 flex items-center justify-between px-6 py-2 border-b border-black/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-2 py-1 rounded hover:bg-black/5"
          >
            Menú
          </button>
          <span>|</span>
          <span>/01 Intro</span>
        </div>
        <div>Cartera Impronta</div>
        <div className="flex gap-2 items-center">
          <span>Red</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
        </div>
      </div>

      {/* RUTAS */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<main className="p-10">Página no encontrada</main>} />
      </Routes>

      {/* OVERLAY + MENÚ LATERAL IZQUIERDO */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          title="Cerrar menú"
        />
        <aside
          id="side-menu"
          role="dialog"
          aria-label="Menú de navegación"
          className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white text-[#111] shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-widest text-neutral-600">Menú</span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm px-2 py-1 rounded hover:bg-black/5"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-2 text-sm">
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/favorites"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
              }
            >
              Favoritos
            </NavLink>
            <NavLink
              to="/requests"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
              }
            >
              Solicitudes
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
              }
            >
              Perfil
            </NavLink>
          </nav>
        </aside>
      </div>
    </div>
  );
}

