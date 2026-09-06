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

export type RescheduleLessonSlot = {
  startDatetime: string;
  endDatetime: string;
  startTime: string;
  endTime: string;
};

export type RescheduleLessonResult = {
  booking: {
    id: string;
    status: "confirmed";
    startDatetime: string;
    endDatetime: string;
  };
};

export async function fetchRescheduleLessonSlots(
  lessonId: string,
  date: string,
  token: string,
  signal?: AbortSignal,
): Promise<RescheduleLessonSlot[]> {
  const params = new URLSearchParams({ date });

  const response = await fetch(
    `${getApiUrl()}/bookings/instructor/${encodeURIComponent(
      lessonId,
    )}/reschedule-slots?${params.toString()}`,
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
    throw new LessonsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as RescheduleLessonSlot[];
}

export async function rescheduleLesson(
  lessonId: string,
  startDatetime: string,
  token: string,
): Promise<RescheduleLessonResult> {
  const response = await fetch(
    `${getApiUrl()}/bookings/instructor/${encodeURIComponent(
      lessonId,
    )}/reschedule`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDatetime,
      }),
    },
  );

  if (!response.ok) {
    throw new LessonsApiError(
      await getResponseErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as RescheduleLessonResult;
}
