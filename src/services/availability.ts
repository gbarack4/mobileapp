const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type DailyAvailabilityPayload = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
  slotInterval: number;
  locations: string[];
  breaks?: { startTime: string; endTime: string }[];
  travelTime: number;
};

type DailyAvailabilityResponse = Omit<
  DailyAvailabilityPayload,
  "startTime" | "endTime" | "locations"
> & {
  startTime: string | null;
  endTime: string | null;
  locations: {
    suburb: string;
  }[];
};

function normalizeTime(value: string): string {
  return value.trim().slice(0, 5);
}

function toDailyAvailabilityPayload(
  day: DailyAvailabilityPayload,
): DailyAvailabilityPayload {
  return {
    dayOfWeek: day.dayOfWeek,
    isWorking: day.isWorking,
    startTime: day.startTime == null ? undefined : normalizeTime(day.startTime),
    endTime: day.endTime == null ? undefined : normalizeTime(day.endTime),
    slotInterval: day.slotInterval,
    locations: day.locations,
    breaks: day.breaks?.map((item) => ({
      startTime: normalizeTime(item.startTime),
      endTime: normalizeTime(item.endTime),
    })),
    travelTime: day.travelTime,
  };
}

export async function saveInstructorAvailability(
  getToken: () => Promise<string | null>,
  daysData: DailyAvailabilityPayload[],
) {
  const token = await getToken();
  const days = daysData.map(toDailyAvailabilityPayload);

  const res = await fetch(`${API_URL}/availability/bulk`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ days }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    console.error("Backend validation failed for bulk update:", errorData);
    throw new Error("Failed to save availability");
  }

  return res.json();
}

export async function getInstructorAvailability(
  getToken: () => Promise<string | null>,
): Promise<DailyAvailabilityPayload[]> {
  const token = await getToken();

  const res = await fetch(`${API_URL}/availability/daily`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch availability");
  }

  const days: DailyAvailabilityResponse[] = await res.json();

  return days.map((day) =>
    toDailyAvailabilityPayload({
      dayOfWeek: day.dayOfWeek,
      isWorking: day.isWorking,
      startTime: day.startTime ?? undefined,
      endTime: day.endTime ?? undefined,
      slotInterval: day.slotInterval,
      locations: day.locations.map((location) => location.suburb),
      breaks: day.breaks,
      travelTime: day.travelTime,
    }),
  );
}
