import type { InstructorWeeklyEarningsResponse } from "@/types/instructor-earnings";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export class InstructorEarningsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "InstructorEarningsApiError";
  }
}

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
    return `Request failed with status ${response.status}`;
  }

  return `Request failed with status ${response.status}`;
}

export async function fetchInstructorEarnings(
  token: string,
  weekOffset: number,
  signal?: AbortSignal,
): Promise<InstructorWeeklyEarningsResponse> {
  const searchParams = new URLSearchParams({
    weekOffset: String(weekOffset),
  });

  const response = await fetch(
    `${getApiUrl()}/instructor/earnings?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new InstructorEarningsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as InstructorWeeklyEarningsResponse;
}
