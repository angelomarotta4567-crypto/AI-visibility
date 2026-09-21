/** Parses a comma-separated "aliases" form field into a clean string array. */
export function parseAliases(raw: FormDataEntryValue | null): string[] {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  return [...new Set(text.split(",").map((a) => a.trim()).filter(Boolean))];
}
