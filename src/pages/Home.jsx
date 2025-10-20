export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111]">
      {/* TÍTULO ARRIBA-IZQUIERDA */}
      <header className="px-6 sm:px-10 pt-8 sm:pt-12">
        <h1
          className="font-black leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(4rem, 12vw, 12rem)" }}
        >
          IMPRONTA
        </h1>

        {/* LÍNEA INFORMATIVA INFERIOR */}
        <div className="mt-3 pb-3 border-b border-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-wide text-neutral-700">
          <div>Impronta</div>
          <div className="text-center">Galería de arte</div>
          <div className="text-center">Sitio web</div>
          <div className="text-right">Disponible en todo el mundo</div>
        </div>
      </header>

      {/* CUERPO CENTRAL */}
      <main className="px-6 sm:px-10 py-16 flex flex-col items-center text-center">
        {/* INTRO */}
        <section className="max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-600 mb-4">
            Introducción
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-neutral-800">
            Impronta es un espacio dedicado a la simplicidad visual, la luz y la
            forma. Curamos obra contemporánea con una mirada esencialista: menos
            ruido, más presencia.
          </p>
        </section>

        {/* OBRAS + BUSCADOR */}
        <section className="w-full flex flex-col items-center mb-12">
          <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-600 mb-4">
            Obras
          </h2>
          <div className="w-full max-w-md">
            <input
              type="text"
              placeholder="Buscar obras o artistas..."
              className="w-full border border-black/20 rounded-full px-4 py-2 text-sm outline-none focus:border-black/40 transition placeholder:text-neutral-400"
            />
          </div>
        </section>

        {/* GALERÍA DE OBRAS (PLACEHOLDER) */}
        <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-3 cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square w-full bg-neutral-300 rounded-2xl transition-colors duration-300 group-hover:bg-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"></div>
              <div className="text-center text-xs tracking-wide space-y-0.5">
                <p className="font-medium text-neutral-800">Obra {i + 1}</p>
                <p className="text-neutral-500">Artista {i + 1}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* BARRA INFERIOR */}
      <div className="px-6 sm:px-10 pb-3 border-t border-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-wide text-neutral-700">
        <div>Impronta</div>
        <div className="text-center">Espacio de búsqueda</div>
        <div className="text-center">Opciones</div>
        <div className="text-right">Explorar</div>
      </div>
    </div>
  );
}

