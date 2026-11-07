/** Vídeo da marca: sem autoplay e sem áudio automático; só carrega ao dar play. */
export function BrandVideo() {
  return (
    <section aria-labelledby="brand-video-title" className="mt-12">
      <h2 id="brand-video-title" className="font-display text-2xl font-bold">
        Conheça a marca
      </h2>
      <video
        controls
        preload="none"
        playsInline
        poster="/brand/motion-poster.jpg"
        className="mt-4 aspect-video w-full rounded-xl border border-border bg-surface"
      >
        <source src="/brand/motion.mp4" type="video/mp4" />
        Seu navegador não reproduz vídeo. <a href="/brand/motion.mp4">Abrir o vídeo da marca</a>.
      </video>
    </section>
  );
}
