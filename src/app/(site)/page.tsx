import { HighlightsGrid } from "@/components/posts/HighlightsGrid";
import { LatestPosts } from "@/components/posts/LatestPosts";
import { Hero } from "@/components/site/Hero";
import { QuickLinks } from "@/components/site/QuickLinks";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";
import { db } from "@/lib/db/client";
import { getHomeData, LATEST_COUNT } from "@/lib/posts/home";

export const revalidate = 300;

export default async function Home() {
  const { highlights, latest } = await getHomeData(db);
  return (
    <>
      <Hero />
      <QuickLinks />
      <HighlightsGrid highlights={highlights} />
      <LatestPosts posts={latest} pageSize={LATEST_COUNT} />
      <WhatsAppCta className="mx-auto mt-12 w-[calc(100%-2rem)] max-w-7xl lg:w-[calc(100%-3rem)]" />
      <div className="pb-12" />
    </>
  );
}
