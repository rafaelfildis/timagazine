import { getSetting } from "@/lib/settings";
import { WhatsAppButton } from "./WhatsAppButton";

/** Faixa de chamada para o Canal do WhatsApp. Sem URL configurada, não renderiza nada. */
export async function WhatsAppCta({ className = "" }: { className?: string }) {
  const url = await getSetting("whatsapp_channel_url");
  if (!url) return null;
  return (
    <section
      aria-labelledby="cta-whatsapp"
      className={`flex flex-col items-start gap-4 rounded-xl border border-border bg-deep/60 p-6 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        <h2 id="cta-whatsapp" className="font-display text-xl font-bold">
          Receba as notícias no WhatsApp
        </h2>
        <p className="mt-1 text-muted">Acompanhe os destaques da TI MAGAZINE pelo nosso canal.</p>
      </div>
      <WhatsAppButton variant="solid" className="shrink-0 px-6" />
    </section>
  );
}
