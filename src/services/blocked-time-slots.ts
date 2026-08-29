import { Platform } from "react-native";

const STORAGE_KEY = "ih_blocked_time_slots";

type Listener = () => void;

/** Map of ISO date (YYYY-MM-DD) → blocked slot labels (e.g. "8:30 AM") */
type BlockedSlotsByDate = Record<string, string[]>;

let memoryStore: BlockedSlotsByDate | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === "web" && typeof localStorage !== "undefined";
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readStore(): BlockedSlotsByDate {
  if (memoryStore) {
    return memoryStore;
  }

  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BlockedSlotsByDate;
        memoryStore = parsed && typeof parsed === "object" ? parsed : {};
        return memoryStore;
      }
    } catch {
      // fall through
    }
  }

  memoryStore = {};
  return memoryStore;
}

function writeStore(next: BlockedSlotsByDate) {
  memoryStore = next;
  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  }
  notify();
}

export function toIsoDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBlockedSlotsForDate(date: Date): string[] {
  const key = toIsoDateKey(date);
  return [...(readStore()[key] ?? [])];
}

export function isSlotBlocked(date: Date, slot: string) {
  return getBlockedSlotsForDate(date).includes(slot);
}

function persistSlots(date: Date, slots: Set<string>) {
  const key = toIsoDateKey(date);
  const store = { ...readStore() };

  if (slots.size === 0) {
    delete store[key];
  } else {
    store[key] = [...slots];
  }

  writeStore(store);
  return [...slots];
}

export function addBlockedSlots(date: Date, slots: string[]) {
  const current = new Set(getBlockedSlotsForDate(date));
  slots.forEach((slot) => current.add(slot));
  return persistSlots(date, current);
}

export function removeBlockedSlots(date: Date, slots: string[]) {
  const current = new Set(getBlockedSlotsForDate(date));
  slots.forEach((slot) => current.delete(slot));
  return persistSlots(date, current);
}

export function removeBlockedSlot(date: Date, slot: string) {
  return removeBlockedSlots(date, [slot]);
}

export function toggleBlockedSlot(date: Date, slot: string) {
  const current = new Set(getBlockedSlotsForDate(date));

  if (current.has(slot)) {
    current.delete(slot);
  } else {
    current.add(slot);
  }

  return persistSlots(date, current);
}

export function subscribeBlockedSlots(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
