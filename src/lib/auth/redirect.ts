const DEFAULT_REDIRECT = "/admin";

/**
 * Valida o `callbackUrl` do login: só caminho do próprio painel (/admin ou /admin/...).
 * Valida o resultado NORMALIZADO (segmentos `.`/`..` e `%2e` já resolvidos), porque
 * `/..//evil.com` vira `//evil.com`. Qualquer outra coisa volta para /admin.
 */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT;
  // Barra invertida e caracteres de controle: navegadores os tratam como "/" ou os removem.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return DEFAULT_REDIRECT;
  try {
    const base = "http://localhost.invalid";
    const url = new URL(value, base);
    const { pathname } = url;
    if (url.origin !== base || pathname.startsWith("//") || pathname.includes("\\")) {
      return DEFAULT_REDIRECT;
    }
    if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return DEFAULT_REDIRECT;
    return pathname + url.search + url.hash;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
