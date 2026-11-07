import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PostBadges } from "@/components/posts/PostBadges";
import { PostCard } from "@/components/posts/PostCard";
import { ShareButtons } from "@/components/posts/ShareButtons";
import { SourceCredit } from "@/components/posts/SourceCredit";
import { ViewPing } from "@/components/posts/ViewPing";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";
import { siteConfig } from "@/config/site";
import { MODALITIES, ORIGIN_LABEL } from "@/config/taxonomy";
import { db } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/lib/markdown";
import { getPostBySlug, getRelated } from "@/lib/posts/queries";

export const revalidate = 300;

// Sem pré-renderização no build: cada matéria é gerada na primeira visita (ISR sob demanda).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const loadPost = cache((slug: string) => getPostBySlug(db, slug));

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};
  const canonical = `/noticias/${post.slug}`;
  const image = post.imageUrl ?? "/brand/og-default.png";
  return {
    title: post.title,
    description: post.dek,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.dek,
      url: canonical,
      siteName: siteConfig.name,
      locale: "pt_BR",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: [{ url: image, alt: post.imageAlt ?? post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.dek, images: [image] },
  };
}

/** Escapa `<` para o JSON nunca fechar a tag <script>. */
const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const related = await getRelated(db, post, 3);
  const modalityLabel = MODALITIES.find((m) => m.value === post.modality)?.label ?? post.modality;
  const url = absolute(`/noticias/${post.slug}`);
  const wasUpdated = post.updatedAt.getTime() - post.publishedAt.getTime() > 60_000;
  const caption = post.imageAi ? "Ilustração gerada por IA" : post.imageAlt;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.dek,
    image: [absolute(post.imageUrl ?? "/brand/og-default.png")],
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absolute("/brand/logo-horizontal.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <ViewPing id={post.id} />

      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          <Link href={`/noticias?categoria=${post.categorySlug}`} className="hover:underline">
            {post.categoryName}
          </Link>{" "}
          · {modalityLabel}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
        <p className="text-lg text-muted">{post.dek}</p>
        <PostBadges sponsored={post.sponsored} modality={post.modality} />
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span>Por {post.authorName}</span>
          <span aria-hidden="true">·</span>
          <span>
            Publicado em{" "}
            <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
          </span>
          {wasUpdated && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Atualizado em{" "}
                <time dateTime={post.updatedAt.toISOString()}>{formatDate(post.updatedAt)}</time>
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min de leitura</span>
          <span aria-hidden="true">·</span>
          <span>{ORIGIN_LABEL[post.origin]}</span>
        </p>
      </header>

      {post.imageUrl && (
        <figure className="mt-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-2">
            <Image
              src={post.imageUrl}
              alt={post.imageAlt ?? post.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
          {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
        </figure>
      )}

      <div className="mt-8">
        <Markdown source={post.body} />
      </div>

      {post.origin === "curadoria" && post.sourceName && (
        <div className="mt-8">
          <SourceCredit sourceName={post.sourceName} sourceUrl={post.sourceUrl} />
        </div>
      )}

      {post.tags.length > 0 && (
        <nav aria-label="Tags" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/noticias?tag=${t.slug}`}
                  className="inline-flex min-h-8 items-center rounded-full bg-surface-2 px-3 text-sm text-text hover:text-primary"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section aria-labelledby="compartilhar" className="mt-8">
        <h2 id="compartilhar" className="mb-3 font-display text-lg font-bold">
          Compartilhar
        </h2>
        <ShareButtons url={url} title={post.title} />
      </section>

      {related.length > 0 && (
        <section aria-labelledby="relacionadas" className="mt-12 border-t border-border pt-8">
          <h2 id="relacionadas" className="mb-4 font-display text-xl font-bold">
            Leia também
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id} className="flex">
                <div className="w-full">
                  <PostCard post={r} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <WhatsAppCta className="mt-12" />
    </article>
  );
}
