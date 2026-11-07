/** Palavras ÷ 200, arredondado para cima, mínimo 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
