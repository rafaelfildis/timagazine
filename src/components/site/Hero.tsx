import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { HeroGlobe } from "./HeroGlobe";
import { WhatsAppButton } from "./WhatsAppButton";

export async function Hero() {
  const hasWhatsApp = Boolean(await getSetting("whatsapp_channel_url"));
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-br from-deep/70 via-bg to-bg lg:max-h-[70vh]">
      <HeroGlobe className="pointer-events-none absolute -right-14 top-1/2 -z-10 size-64 -translate-y-1/2 opacity-40 sm:size-80 sm:opacity-60 lg:right-6 lg:size-[26rem] lg:opacity-100 xl:right-16" />
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="max-w-xl lg:max-w-2xl">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
            Tecnologia, inovação e negócios para quem lidera a transformação.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted lg:text-lg">
            Informação qualificada, tendências de mercado e as vozes de CIOs, líderes e
            especialistas em um só lugar.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppButton variant="solid" className="px-6" />
            <Link
              href="/noticias"
              className={`inline-flex min-h-11 items-center justify-center rounded-md px-6 text-sm font-semibold ${
                hasWhatsApp
                  ? "border border-text/40 text-text hover:border-text"
                  : "bg-primary text-bg hover:brightness-110"
              }`}
            >
              Leia as últimas notícias
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
