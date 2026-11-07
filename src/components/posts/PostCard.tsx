import Image from "next/image";
import Link from "next/link";
import { MODALITIES } from "@/config/taxonomy";
import { formatDate } from "@/lib/format";
import type { PostCard as PostCardData } from "@/lib/posts/queries";
import { PostBadges } from "./PostBadges";

export const FALLBACK_IMAGE = "/brand/capa-padrao.jpg";

type Props = { post: PostCardData; size: "lg" | "md" | "sm"; priority?: boolean };

const SIZES: Record<Props["size"], string> = {
  lg: "(min-width: 1024px) 66vw, 100vw",
  md: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  sm: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
};

const TITLE_CLASS: Record<Props["size"], string> = {
  lg: "text-2xl sm:text-3xl",
  md: "text-lg",
  sm: "text-base",
};

export function PostCard({ post, size, priority = false }: Props) {
  const modalityLabel = MODALITIES.find((m) => m.value === post.modality)?.label ?? post.modality;
  const kicker = `${post.categoryName} · ${modalityLabel}`;
  const image = (
    <Image
      src={post.imageUrl ?? FALLBACK_IMAGE}
      alt=""
      fill
      sizes={SIZES[size]}
      priority={priority}
      className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105"
    />
  );
  const meta = (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
      <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min de leitura</span>
    </p>
  );
  const title = (
    <h3 className={`line-clamp-3 font-display font-bold leading-snug text-text ${TITLE_CLASS[size]}`}>
      {/* O link cobre o card inteiro (::after); o nome acessível é só o título. */}
      <Link
        href={`/noticias/${post.slug}`}
        className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
      >
        {post.title}
      </Link>
    </h3>
  );

  if (size === "lg") {
    return (
      <article className="group relative isolate flex min-h-80 overflow-hidden rounded-xl border border-border bg-surface focus-within:ring-2 focus-within:ring-primary">
        <div className="absolute inset-0 -z-10">{image}</div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg/95 via-bg/70 to-transparent" />
        <div className="mt-auto flex w-full flex-col gap-2 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{kicker}</p>
          {title}
          <p className="line-clamp-2 text-sm text-text/90">{post.dek}</p>
          <div className="flex flex-wrap items-center gap-3">
            <PostBadges sponsored={post.sponsored} modality={post.modality} />
            {meta}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface focus-within:ring-2 focus-within:ring-primary">
      <div className="relative aspect-video w-full overflow-hidden bg-surface-2">{image}</div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{kicker}</p>
        {title}
        {size === "md" && <p className="line-clamp-2 text-sm text-muted">{post.dek}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <PostBadges sponsored={post.sponsored} modality={post.modality} />
          {meta}
        </div>
      </div>
    </article>
  );
}
