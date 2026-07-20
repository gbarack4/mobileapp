import { Platform } from 'react-native';

export type DistanceUnit = 'km' | 'mi';
export type TimeFormat = '12h' | '24h';

export type AppSettings = {
  pushNotifications: boolean;
  lessonReminders: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  distanceUnit: DistanceUnit;
  timeFormat: TimeFormat;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotifications: true,
  lessonReminders: true,
  bookingAlerts: true,
  paymentAlerts: true,
  distanceUnit: 'km',
  timeFormat: '12h',
};

const STORAGE_KEY = 'ih_app_settings';

type Listener = () => void;

let memorySettings: AppSettings | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeSettings(parsed: Partial<AppSettings>): AppSettings {
  return {
    pushNotifications:
      typeof parsed.pushNotifications === 'boolean'
        ? parsed.pushNotifications
        : DEFAULT_APP_SETTINGS.pushNotifications,
    lessonReminders:
      typeof parsed.lessonReminders === 'boolean'
        ? parsed.lessonReminders
        : DEFAULT_APP_SETTINGS.lessonReminders,
    bookingAlerts:
      typeof parsed.bookingAlerts === 'boolean'
        ? parsed.bookingAlerts
        : DEFAULT_APP_SETTINGS.bookingAlerts,
    paymentAlerts:
      typeof parsed.paymentAlerts === 'boolean'
        ? parsed.paymentAlerts
        : DEFAULT_APP_SETTINGS.paymentAlerts,
    distanceUnit:
      parsed.distanceUnit === 'km' || parsed.distanceUnit === 'mi'
        ? parsed.distanceUnit
        : DEFAULT_APP_SETTINGS.distanceUnit,
    timeFormat:
      parsed.timeFormat === '12h' || parsed.timeFormat === '24h'
        ? parsed.timeFormat
        : DEFAULT_APP_SETTINGS.timeFormat,
  };
}

export function getAppSettings(): AppSettings {
  if (memorySettings) {
    return { ...memorySettings };
  }

  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memorySettings = normalizeSettings(JSON.parse(raw) as Partial<AppSettings>);
        return { ...memorySettings };
      }
    } catch {
      // fall through to defaults
    }
  }

  memorySettings = { ...DEFAULT_APP_SETTINGS };
  return { ...memorySettings };
}

export function setAppSettings(next: Partial<AppSettings>) {
  const current = getAppSettings();
  memorySettings = normalizeSettings({
    ...current,
    ...next,
  });

  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memorySettings));
  }

  notify();
}

export function subscribeAppSettings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
