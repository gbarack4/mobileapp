import type {
  InstructorStripeSchool,
  StripeConnectionResponse,
  StripeConnectionStatusResponse,
} from "@/types/payment";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

function getApiUrl(): string {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return API_URL;
}

async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (body && typeof body === "object" && "message" in body) {
      const message = body.message;

      if (typeof message === "string") {
        return message;
      }

      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === "string")
      ) {
        return message.join(", ");
      }
    }
  } catch {
    // Ignore invalid or non-JSON error responses.
  }

  return `Request failed with status ${response.status}`;
}

async function request<T>(
  path: string,
  token: string,
  schoolId?: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(schoolId ? { "x-school-id": schoolId } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response));
  }

  return (await response.json()) as T;
}

export function getInstructorStripeSchools(
  token: string,
): Promise<InstructorStripeSchool[]> {
  return request<InstructorStripeSchool[]>(
    "/stripe/instructor-connect/schools",
    token,
  );
}

export function createInstructorStripeConnection(
  schoolId: string,
  token: string,
): Promise<StripeConnectionResponse> {
  return request<StripeConnectionResponse>(
    "/stripe/instructor-connect",
    token,
    schoolId,
    {
      method: "POST",
    },
  );
}

export function getInstructorStripeStatus(
  schoolId: string,
  token: string,
): Promise<StripeConnectionStatusResponse> {
  return request<StripeConnectionStatusResponse>(
    "/stripe/instructor-connect/status",
    token,
    schoolId,
  );
}

export function disconnectInstructorStripeSchool(
  schoolId: string,
  token: string,
): Promise<StripeConnectionStatusResponse> {
  return request<StripeConnectionStatusResponse>(
    "/stripe/instructor-connect/disconnect",
    token,
    schoolId,
    {
      method: "POST",
    },
  );
}

export function reconnectInstructorStripeSchool(
  schoolId: string,
  token: string,
): Promise<StripeConnectionResponse> {
  return request<StripeConnectionResponse>(
    "/stripe/instructor-connect/reconnect",
    token,
    schoolId,
    {
      method: "POST",
    },
  );
}
