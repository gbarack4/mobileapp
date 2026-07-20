import { Platform } from 'react-native';

export type BreakApplyMode = 'between_lessons' | 'scheduled';

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
  breakApplyMode: 'scheduled',
  breakStartTime: '',
  dynamicScheduling: false,
};

const STORAGE_KEY = 'ih_calendar_settings';

type Listener = () => void;

let memorySettings: CalendarSettings | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeSettings(parsed: Partial<CalendarSettings>): CalendarSettings {
  return {
    travelTimeMinutes:
      typeof parsed.travelTimeMinutes === 'number'
        ? parsed.travelTimeMinutes
        : DEFAULT_CALENDAR_SETTINGS.travelTimeMinutes,
    breakMinutes:
      typeof parsed.breakMinutes === 'number'
        ? parsed.breakMinutes
        : DEFAULT_CALENDAR_SETTINGS.breakMinutes,
    breakApplyMode:
      parsed.breakApplyMode === 'scheduled' || parsed.breakApplyMode === 'between_lessons'
        ? parsed.breakApplyMode
        : DEFAULT_CALENDAR_SETTINGS.breakApplyMode,
    breakStartTime:
      typeof parsed.breakStartTime === 'string' &&
      (parsed.breakStartTime === '' || /^\d{2}:\d{2}$/.test(parsed.breakStartTime))
        ? parsed.breakStartTime
        : DEFAULT_CALENDAR_SETTINGS.breakStartTime,
    dynamicScheduling:
      typeof parsed.dynamicScheduling === 'boolean'
        ? parsed.dynamicScheduling
        : DEFAULT_CALENDAR_SETTINGS.dynamicScheduling,
  };
}

export function getCalendarSettings(): CalendarSettings {
  if (memorySettings) {
    return { ...memorySettings };
  }

  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memorySettings = normalizeSettings(JSON.parse(raw) as Partial<CalendarSettings>);
        return { ...memorySettings };
      }
    } catch {
      // fall through to defaults
    }
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

  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memorySettings));
  }

  notify();
}

export function subscribeCalendarSettings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function formatBreakTimeLabel(time: string) {
  const [hoursRaw, minutes] = time.split(':');
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours)) {
    return time;
  }

  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}
