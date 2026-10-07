export type RefreshMethod = "password" | "oauth";
export type RefreshCredential = Readonly<{
  refreshToken: string;
  refreshMethod: RefreshMethod;
  lastActivityAt?: number;
}>;

export function encodeRefreshCredential(value: RefreshCredential): string {
  return JSON.stringify({
    version: 1,
    refreshToken: value.refreshToken,
    refreshMethod: value.refreshMethod,
    lastActivityAt: value.lastActivityAt,
  });
}

export function decodeRefreshCredential(
  value: string | null,
): RefreshCredential | null {
  if (!value) return null;
  if (!value.startsWith("{"))
    return { refreshToken: value, refreshMethod: "password" };
  const data: unknown = JSON.parse(value);
  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    data.version !== 1 ||
    !("refreshToken" in data) ||
    typeof data.refreshToken !== "string" ||
    !data.refreshToken ||
    !("refreshMethod" in data) ||
    (data.refreshMethod !== "password" && data.refreshMethod !== "oauth")
  )
    throw new Error("Invalid saved session");
  const lastActivityAt =
    "lastActivityAt" in data ? data.lastActivityAt : undefined;
  if (
    lastActivityAt !== undefined &&
    (typeof lastActivityAt !== "number" ||
      !Number.isFinite(lastActivityAt) ||
      lastActivityAt <= 0)
  ) {
    throw new Error("Invalid saved activity timestamp");
  }
  return {
    refreshToken: data.refreshToken,
    refreshMethod: data.refreshMethod,
    lastActivityAt,
  };
}
