import Image from "next/image";

type Props = { variant?: "horizontal" | "symbol"; className?: string; priority?: boolean };

/** PNG com transparência derivado do JPG original (fonte: logo-horizontal.jpg). */
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
    <span className={`inline-flex ${className}`}>
      <Image
        src="/brand/logo-horizontal.png"
        alt="TI MAGAZINE"
        width={1600}
        height={533}
        className="h-9 w-auto lg:h-12"
        priority={priority}
      />
    </span>
  );
}
