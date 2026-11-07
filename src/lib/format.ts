const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Bahia",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** `dd/MM/yyyy` no fuso America/Bahia. */
export function formatDate(d: Date): string {
  const p = Object.fromEntries(dateFormat.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year}`;
}
