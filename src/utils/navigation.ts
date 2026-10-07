import { router, type Href } from "expo-router";

export function goBackOr(fallback: Href = "/dashboard") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function routeParamId(
  localValue: string | string[] | undefined,
  globalValue: string | string[] | undefined,
  pathname: string,
  segment: string,
): string {
  const fromParams =
    firstSearchParam(localValue) || firstSearchParam(globalValue);

  if (fromParams) {
    return decodeParam(fromParams);
  }

  const parts = pathname.split("/").filter(Boolean);
  const index = parts.lastIndexOf(segment);
  const fromPath = index >= 0 ? (parts[index + 1] ?? "") : "";

  return fromPath ? decodeParam(fromPath) : "";
}
