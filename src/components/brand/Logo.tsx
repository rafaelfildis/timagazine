import Image from "next/image";

type Props = { variant?: "horizontal" | "symbol"; className?: string; priority?: boolean };

/**
 * O arquivo horizontal é um JPG sobre preto puro: o contêiner pinta #000 atrás
 * para não aparecer uma caixa contra o fundo #070A07. Nunca distorce nem recorta.
 */
export function Logo({ variant = "horizontal", className = "", priority = false }: Props) {
  if (variant === "symbol") {
    return (
      <Image
        src="/brand/simbolo-ti.png"
        alt="TI MAGAZINE"
        width={64}
        height={64}
        className={`h-9 w-auto ${className}`}
        priority={priority}
      />
    );
  }
  return (
    <span className={`inline-flex rounded-sm bg-black ${className}`}>
      <Image
        src="/brand/logo-horizontal.jpg"
        alt="TI MAGAZINE"
        width={1600}
        height={533}
        className="h-10 w-auto"
        priority={priority}
      />
    </span>
  );
}
