export const SESSION_IDLE_TIMEOUT_MS = 3 * 60 * 60 * 1000;

export function idleTimeRemaining(
  lastActivityAt: number,
  now = Date.now(),
): number {
  return Math.max(
    0,
    SESSION_IDLE_TIMEOUT_MS - Math.max(0, now - lastActivityAt),
  );
}
