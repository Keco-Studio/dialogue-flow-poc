const CURRENT_VERSION = 1;

// Ordered array: migrations[0] upgrades v1 → v2, etc.
const migrations: Array<(data: Record<string, unknown>) => Record<string, unknown>> = [];

export function migrateToLatest(data: Record<string, unknown>): Record<string, unknown> {
  let current = { ...data };
  const version = (current.schemaVersion as number) ?? 1;

  if (version > CURRENT_VERSION) {
    throw new Error(
      `Unsupported schema version ${version}. Current version is ${CURRENT_VERSION}. Please update the application.`,
    );
  }

  for (let i = version - 1; i < migrations.length; i++) {
    current = migrations[i](current);
  }

  return current;
}

export { CURRENT_VERSION };
