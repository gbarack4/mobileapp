const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type CancelLessonResult = {
  booking: {
    id: string;
    status: "cancelled";
  };
  creditReturnedMinutes: number;
  balanceMinutes: number;
};

export class LessonsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LessonsApiError";
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

export async function cancelLesson(
  lessonId: string,
  token: string,
): Promise<CancelLessonResult> {
  const response = await fetch(
    `${getApiUrl()}/bookings/instructor/${encodeURIComponent(lessonId)}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new LessonsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as CancelLessonResult;
}
