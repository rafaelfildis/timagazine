import { getSetting } from "@/lib/settings";

type Props = { variant?: "solid" | "outline"; className?: string };

/** Server component: sem URL configurada, não renderiza nada. */
export async function WhatsAppButton({ variant = "solid", className = "" }: Props) {
  const url = await getSetting("whatsapp_channel_url");
  if (!url) return null;
  const style =
    variant === "solid"
      ? "bg-primary text-bg hover:brightness-110"
      : "border border-primary text-primary hover:bg-primary/10";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold ${style} ${className}`}
    >
      Assine no WhatsApp
    </a>
  );
}
