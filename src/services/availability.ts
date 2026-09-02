import { findWorkSuburbByName } from "@/data/mock-work-locations";

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

type AvailabilityLocationPayload = {
  suburb: string;
  postcode: string | null;
  latitude: number;
  longitude: number;
};

type DailyAvailabilityRequest = Omit<DailyAvailabilityPayload, "locations"> & {
  locations: AvailabilityLocationPayload[];
};

type DailyAvailabilityResponse = Omit<
  DailyAvailabilityPayload,
  "startTime" | "endTime" | "locations"
> & {
  startTime: string | null;
  endTime: string | null;
  locations: {
    suburb: string;
    postcode?: string | null;
  }[];
};

function normalizeTime(value: string): string {
  return value.trim().slice(0, 5);
}

function mapLocationToPayload(
  locationName: string,
): AvailabilityLocationPayload {
  const suburb = findWorkSuburbByName(locationName);

  if (!suburb) {
    throw new Error(`Unknown availability location: ${locationName}`);
  }

  return {
    suburb: suburb.name,
    postcode: null,
    latitude: suburb.centroid.latitude,
    longitude: suburb.centroid.longitude,
  };
}

function toDailyAvailabilityRequest(
  day: DailyAvailabilityPayload,
): DailyAvailabilityRequest {
  return {
    dayOfWeek: day.dayOfWeek,
    isWorking: day.isWorking,
    startTime: day.startTime == null ? undefined : normalizeTime(day.startTime),
    endTime: day.endTime == null ? undefined : normalizeTime(day.endTime),
    slotInterval: day.slotInterval,
    locations: day.isWorking ? day.locations.map(mapLocationToPayload) : [],
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

  const days = daysData.map(toDailyAvailabilityRequest);

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

  return days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    isWorking: day.isWorking,
    startTime: day.startTime == null ? undefined : normalizeTime(day.startTime),
    endTime: day.endTime == null ? undefined : normalizeTime(day.endTime),
    slotInterval: day.slotInterval,
    locations: day.locations.map((location) => location.suburb),
    breaks: day.breaks?.map((item) => ({
      startTime: normalizeTime(item.startTime),
      endTime: normalizeTime(item.endTime),
    })),
    travelTime: day.travelTime,
  }));
}
