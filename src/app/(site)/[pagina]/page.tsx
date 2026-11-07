import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { Markdown } from "@/lib/markdown";

export const revalidate = 300;
// Slug fora da lista abaixo é um 404 real (rotas estáticas, como /noticias, têm prioridade).
export const dynamicParams = false;

const POLICY_SLUGS = ["politica-de-privacidade", "termos-de-uso", "politica-editorial"] as const;
type PolicySlug = (typeof POLICY_SLUGS)[number];

const isPolicy = (s: string): s is PolicySlug => (POLICY_SLUGS as readonly string[]).includes(s);

export function generateStaticParams() {
  return POLICY_SLUGS.map((pagina) => ({ pagina }));
}

type Props = { params: Promise<{ pagina: string }> };

const load = async (slug: PolicySlug) =>
  (await db.select().from(pages).where(eq(pages.slug, slug)).limit(1))[0];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  if (!isPolicy(pagina)) return {};
  const page = await load(pagina);
  return { title: page?.title, alternates: { canonical: `/${pagina}` } };
}

export default async function PoliticaPage({ params }: Props) {
  const { pagina } = await params;
  if (!isPolicy(pagina)) notFound();
  const page = await load(pagina);
  if (!page) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{page.title}</h1>
      <div className="mt-6">
        <Markdown source={page.body} />
      </div>
    </div>
  );
}
