export function stableStringify(obj: unknown): string {
  return JSON.stringify(
    obj,
    (_, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        );
      }
      return value;
    },
    2,
  );
}
