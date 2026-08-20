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

export async function saveInstructorAvailability(
  getToken: () => Promise<string | null>,
  daysData: DailyAvailabilityPayload[],
) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/availability/bulk`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ days: daysData }),
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

  return res.json();
}
