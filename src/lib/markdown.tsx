import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { siteConfig } from "@/config/site";

const siteHost = new URL(siteConfig.url).host;

function isExternal(href: string | undefined): boolean {
  if (!href || !/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host !== siteHost;
  } catch {
    return false;
  }
}

type AnchorProps = ComponentProps<"a"> & { node?: unknown };

const components: Components = {
  // O título da matéria já é o h1; "#" no corpo vira h2.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h1: ({ node: _node, ...props }) => <h2 {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a: ({ node: _node, href, children, ...props }: AnchorProps) =>
    isExternal(href) ? (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a {...props} href={href}>
        {children}
      </a>
    ),
  // Imagens do corpo podem vir de qualquer origem; next/image exigiria remotePatterns.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @next/next/no-img-element
  img: ({ node: _node, alt, ...props }) => <img {...props} alt={alt ?? ""} loading="lazy" />,
};

/** Markdown da matéria: GFM, HTML sempre sanitizado (schema padrão do rehype-sanitize). */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
