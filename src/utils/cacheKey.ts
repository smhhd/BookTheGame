import { createHash } from "node:crypto";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)])
    );
  }
  return value;
}

export function stableCacheKey(namespace: string, value: unknown): string {
  const serialized = JSON.stringify(sortValue(value));
  const digest = createHash("sha256").update(serialized).digest("hex");
  return `${namespace}:${digest}`;
}
