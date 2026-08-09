import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#64B5F6",
  "#4DD0E1",
  "#81C784",
  "#FFD54F",
  "#FF8A65",
  "#A1887F",
  "#90A4AE",
] as const;

/**
 * Deterministically maps a user ID to a cursor color from a fixed palette.
 * The same user ID always produces the same color across sessions.
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

declare global {
  // eslint-disable-next-line no-var
  var __liveblocks: Liveblocks | undefined;
}

/**
 * Returns the cached Liveblocks Node client.
 * Deferred so the missing-env error only surfaces at request time, not at
 * module evaluation time (which would break `next build`).
 */
export function getLiveblocks(): Liveblocks {
  if (globalThis.__liveblocks) return globalThis.__liveblocks;

  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is not set");
  }

  const client = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__liveblocks = client;
  }

  return client;
}
