import { siteConfig } from "@/config/site";

// Página provisória da fundação; a Home real substitui este conteúdo.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {siteConfig.name}
      </h1>
      <p className="text-muted">{siteConfig.tagline}</p>
    </div>
  );
}
