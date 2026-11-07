import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BrandVideo } from "@/components/site/BrandVideo";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { Markdown } from "@/lib/markdown";

export const revalidate = 300;

const load = async () => (await db.select().from(pages).where(eq(pages.slug, "sobre")).limit(1))[0];

export async function generateMetadata(): Promise<Metadata> {
  const page = await load();
  return { title: page?.title ?? "Sobre", alternates: { canonical: "/sobre" } };
}

export default async function SobrePage() {
  const page = await load();
  if (!page) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{page.title}</h1>
      <div className="mt-6">
        <Markdown source={page.body} />
      </div>
      <BrandVideo />
    </div>
  );
}
