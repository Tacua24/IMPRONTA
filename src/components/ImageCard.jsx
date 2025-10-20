export default function ImageCard({ img, onClick }) {
    return (
        <button
            onClick={() => onClick?.(img)}
            className="group overflow-hidden rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 transition"
            aria-label={img.title}
        >

            <img
                src={img.url}
                alt={img.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover group-hover:scale-105 transition"
            />
            <div className="p-3 text-left">
                <h3 className="text-sm font-medium">{img.title}</h3>
                <p className="text-xs text-[var(--muted)]">{img.description}</p>
            </div>
        </button>
    );
}

