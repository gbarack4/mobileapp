import type {
  InstructorBookingDetails,
  InstructorBookingsResponse,
} from "@/types/instructor-bookings";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class InstructorBookingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "InstructorBookingsApiError";
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
    // Ignore invalid/non-JSON error responses.
  }

  return `Request failed with status ${response.status}`;
}

export async function fetchInstructorBookings(
  token: string,
  signal?: AbortSignal,
): Promise<InstructorBookingsResponse> {
  const response = await fetch(`${getApiUrl()}/bookings/instructor`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new InstructorBookingsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as InstructorBookingsResponse;
}

export async function fetchInstructorBookingById(
  bookingId: string,
  token: string,
  signal?: AbortSignal,
): Promise<InstructorBookingDetails> {
  const response = await fetch(
    `${getApiUrl()}/bookings/instructor/${encodeURIComponent(bookingId)}`,
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
    throw new InstructorBookingsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as InstructorBookingDetails;
}
