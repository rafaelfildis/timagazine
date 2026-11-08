// America/Bahia não tem horário de verão: UTC-3 fixo (mesma premissa de queries.ts).
const OFFSET_MS = -3 * 3_600_000;
const INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Valor de `<input type="datetime-local">` (horário da Bahia) → Date; vazio ou inválido → undefined. */
export function bahiaInputToDate(value: string | null | undefined): Date | undefined {
  const m = INPUT.exec((value ?? "").trim());
  if (!m) return undefined;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) - OFFSET_MS;
  const date = new Date(utc);
  // Rejeita datas que o JS "corrige" (31/02, 25h...).
  const back = new Date(utc + OFFSET_MS);
  if (
    back.getUTCFullYear() !== y ||
    back.getUTCMonth() !== mo - 1 ||
    back.getUTCDate() !== d ||
    back.getUTCHours() !== h ||
    back.getUTCMinutes() !== mi
  ) {
    return undefined;
  }
  return date;
}

/** Date → valor de `<input type="datetime-local">` no horário da Bahia. */
export function dateToBahiaInput(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}
