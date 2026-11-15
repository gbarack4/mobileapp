const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

async function request(path: string, token: string, method: string, body?: object) {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${API_URL}/instructors/push-devices${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Push device request failed: ${response.status}`);
    }
    if (method === "DELETE") return null;
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

export async function registerPushDevice(token: string, deviceToken: string): Promise<string> {
  const data = await request("", token, "POST", { deviceToken });
  if (!data || typeof data !== "object" || !("registrationId" in data) ||
      typeof data.registrationId !== "string") {
    throw new Error("Invalid push registration response.");
  }
  return data.registrationId;
}

export async function unregisterPushDevice(token: string, registrationId: string): Promise<void> {
  await request(`/${encodeURIComponent(registrationId)}`, token, "DELETE");
}
