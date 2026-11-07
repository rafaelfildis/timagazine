const DEFAULT_REDIRECT = "/admin";

/**
 * Valida o `callbackUrl` do login: só caminho relativo do mesmo site.
 * Qualquer outra coisa (URL absoluta, `//host`, `/\host`, esquemas, controle) volta para /admin.
 */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT;
  // Barra invertida e caracteres de controle: navegadores os tratam como "/" ou os removem.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return DEFAULT_REDIRECT;
  try {
    const base = "http://localhost.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return DEFAULT_REDIRECT;
    return url.pathname + url.search + url.hash;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
