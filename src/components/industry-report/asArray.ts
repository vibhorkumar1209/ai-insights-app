/**
 * Every field rendered by the Industry Report components comes from
 * model-generated JSON, which is not a contract. A field the type says is a
 * string[] can arrive as a bare string, an object, or null, and an unguarded
 * `.map` on that takes down the whole page with
 * "TypeError: e.map is not a function" — a blank "Application error" screen
 * rather than one missing table.
 *
 * This surfaced once archived API-generated reports started rendering here:
 * the same generator produces them, but a much wider range of payloads now
 * reaches the renderer than the ones a browser session happened to create.
 *
 * Degrading to an empty list keeps the rest of the report readable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * Same idea for a value that should be a list of strings but may arrive as one
 * string — there the sensible fallback is a single-item list, not an empty one,
 * so the content still shows.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asStringArray(value: any): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}
