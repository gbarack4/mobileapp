export type RefreshMethod = "password" | "oauth";
export type RefreshCredential = Readonly<{
  refreshToken: string;
  refreshMethod: RefreshMethod;
}>;

export function encodeRefreshCredential(value: RefreshCredential): string {
  return JSON.stringify({
    version: 1,
    refreshToken: value.refreshToken,
    refreshMethod: value.refreshMethod,
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
  return { refreshToken: data.refreshToken, refreshMethod: data.refreshMethod };
}
