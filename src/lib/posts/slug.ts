const MAX_LENGTH = 80;

/** Minúsculas, sem acento, hífens; no máximo 80 caracteres, cortando em palavra inteira. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= MAX_LENGTH) return slug;
  const cut = slug.slice(0, MAX_LENGTH + 1);
  // Hífen logo após o limite: a última palavra coube inteira; senão recua até o último hífen.
  const end = cut.endsWith("-") ? MAX_LENGTH : cut.lastIndexOf("-");
  return (end > 0 ? cut.slice(0, end) : cut.slice(0, MAX_LENGTH)).replace(/-+$/, "");
}
