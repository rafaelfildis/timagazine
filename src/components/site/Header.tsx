import Link from "next/link";
import { ACCOUNT_ENABLED, visibleNav } from "@/config/nav";
import { Logo } from "@/components/brand/Logo";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import { WhatsAppButton } from "./WhatsAppButton";

export async function Header() {
  const items = visibleNav();
  return (
    <header className="sticky top-0 z-40 box-border h-[60px] border-b border-border bg-bg/95 backdrop-blur lg:h-[72px]">
      <div className="relative mx-auto flex h-full max-w-7xl items-center gap-4 px-4 lg:px-6">
        <Link href="/" aria-label="TI MAGAZINE — página inicial" className="shrink-0">
          <Logo priority />
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <DesktopNav items={items} />
          <SearchBox />
          <div className="hidden lg:block">
            <WhatsAppButton variant="solid" />
          </div>
          {ACCOUNT_ENABLED && (
            <Link href="/entrar" className="hidden text-sm font-medium text-text hover:text-primary lg:block">
              Entrar
            </Link>
          )}
          <MobileNav items={items}>
            <div className="mt-2 flex">
              <WhatsAppButton variant="outline" className="w-full" />
            </div>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
