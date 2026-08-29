import {
  getInstructorAvailability,
  saveInstructorAvailability,
  type DailyAvailabilityPayload,
} from "./availability";
import { addMinutesToTime } from "../utils/time";

export type BreakApplyMode = "between_lessons" | "scheduled";

export type CalendarSettings = {
  travelTimeMinutes: number;
  breakMinutes: number;
  breakApplyMode: BreakApplyMode;
  /** 24h "HH:mm" — used when breakApplyMode is "scheduled". */
  breakStartTime: string;
  dynamicScheduling: boolean;
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  travelTimeMinutes: 30,
  breakMinutes: 15,
  breakApplyMode: "scheduled",
  breakStartTime: "",
  dynamicScheduling: false,
};

type Listener = () => void;
type GetToken = () => Promise<string | null>;

let memorySettings: CalendarSettings | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function timeToMinutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function normalizeLocations(locations: DailyAvailabilityPayload["locations"]) {
  if (!Array.isArray(locations)) {
    return [] as string[];
  }

  return locations
    .map((location) => {
      if (typeof location === "string") {
        return location;
      }
      if (location && typeof location === "object" && "suburb" in location) {
        const suburb = (location as { suburb?: unknown }).suburb;
        return typeof suburb === "string" ? suburb : "";
      }
      return "";
    })
    .filter(Boolean);
}

export function normalizeSettings(
  parsed: Partial<CalendarSettings>,
): CalendarSettings {
  return {
    travelTimeMinutes:
      typeof parsed.travelTimeMinutes === "number"
        ? parsed.travelTimeMinutes
        : DEFAULT_CALENDAR_SETTINGS.travelTimeMinutes,
    breakMinutes:
      typeof parsed.breakMinutes === "number"
        ? parsed.breakMinutes
        : DEFAULT_CALENDAR_SETTINGS.breakMinutes,
    breakApplyMode:
      parsed.breakApplyMode === "scheduled" ||
      parsed.breakApplyMode === "between_lessons"
        ? parsed.breakApplyMode
        : DEFAULT_CALENDAR_SETTINGS.breakApplyMode,
    breakStartTime:
      typeof parsed.breakStartTime === "string" &&
      (parsed.breakStartTime === "" ||
        /^\d{2}:\d{2}$/.test(parsed.breakStartTime))
        ? parsed.breakStartTime
        : DEFAULT_CALENDAR_SETTINGS.breakStartTime,
    dynamicScheduling:
      typeof parsed.dynamicScheduling === "boolean"
        ? parsed.dynamicScheduling
        : DEFAULT_CALENDAR_SETTINGS.dynamicScheduling,
  };
}

export function calendarSettingsFromAvailability(
  days: DailyAvailabilityPayload[],
  previous: CalendarSettings = DEFAULT_CALENDAR_SETTINGS,
): CalendarSettings {
  const source =
    days.find((day) => day.isWorking) ??
    days.find((day) => typeof day.travelTime === "number") ??
    days[0];

  if (!source) {
    return normalizeSettings(previous);
  }

  const firstBreak = source.breaks?.[0];
  let breakMinutes = previous.breakMinutes;
  let breakStartTime = previous.breakStartTime;

  if (firstBreak?.startTime && firstBreak?.endTime) {
    const start = timeToMinutes(firstBreak.startTime);
    const end = timeToMinutes(firstBreak.endTime);
    if (start !== null && end !== null && end >= start) {
      breakStartTime = firstBreak.startTime;
      breakMinutes = end - start;
    }
  } else if (Array.isArray(source.breaks) && source.breaks.length === 0) {
    breakMinutes = 0;
    breakStartTime = "";
  }

  return normalizeSettings({
    ...previous,
    travelTimeMinutes:
      typeof source.travelTime === "number"
        ? source.travelTime
        : previous.travelTimeMinutes,
    breakMinutes,
    breakStartTime,
    breakApplyMode: "scheduled",
  });
}

function buildBreaks(settings: CalendarSettings) {
  if (settings.breakMinutes <= 0 || !settings.breakStartTime) {
    return [] as { startTime: string; endTime: string }[];
  }

  return [
    {
      startTime: settings.breakStartTime,
      endTime: addMinutesToTime(settings.breakStartTime, settings.breakMinutes),
    },
  ];
}

function applySettingsToDays(
  days: DailyAvailabilityPayload[],
  settings: CalendarSettings,
): DailyAvailabilityPayload[] {
  const breaks = buildBreaks(settings);

  if (days.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      isWorking: false,
      slotInterval: 15,
      locations: [],
      breaks: [],
      travelTime: settings.travelTimeMinutes,
    }));
  }

  return days.map((day) => ({
    ...day,
    locations: normalizeLocations(day.locations),
    travelTime: settings.travelTimeMinutes,
    breaks: day.isWorking ? breaks : [],
  }));
}

export function getCalendarSettings(): CalendarSettings {
  if (memorySettings) {
    return { ...memorySettings };
  }

  memorySettings = { ...DEFAULT_CALENDAR_SETTINGS };
  return { ...memorySettings };
}

export function setCalendarSettings(next: Partial<CalendarSettings>) {
  const current = getCalendarSettings();
  memorySettings = normalizeSettings({
    ...current,
    ...next,
  });
  notify();
}

export async function loadCalendarSettingsFromApi(getToken: GetToken) {
  const days = await getInstructorAvailability(getToken);
  const next = calendarSettingsFromAvailability(days, getCalendarSettings());
  memorySettings = next;
  notify();
  return next;
}

export async function saveCalendarSettingsToApi(
  getToken: GetToken,
  next: Partial<CalendarSettings>,
) {
  const merged = normalizeSettings({
    ...getCalendarSettings(),
    ...next,
  });

  memorySettings = merged;
  notify();

  const days = await getInstructorAvailability(getToken);
  const payload = applySettingsToDays(days, merged);
  await saveInstructorAvailability(getToken, payload);

  return merged;
}

export function subscribeCalendarSettings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function formatBreakTimeLabel(time: string) {
  const [hoursRaw, minutes] = time.split(":");
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours)) {
    return time;
  }

  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}
