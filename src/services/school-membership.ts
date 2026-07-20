import { Platform } from 'react-native';

export type SchoolJoinStatus = 'none' | 'pending' | 'joined' | 'paused';

type MembershipMap = Record<string, SchoolJoinStatus>;

const STORAGE_KEY = 'ih_school_memberships';

type Listener = () => void;

let memoryMap: MembershipMap | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeMap(parsed: unknown): MembershipMap {
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  const next: MembershipMap = {};
  for (const [schoolId, status] of Object.entries(parsed as Record<string, unknown>)) {
    if (
      status === 'pending' ||
      status === 'joined' ||
      status === 'paused' ||
      status === 'none'
    ) {
      next[schoolId] = status;
    }
  }
  return next;
}

function readMap(): MembershipMap {
  if (memoryMap) {
    return { ...memoryMap };
  }

  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryMap = normalizeMap(JSON.parse(raw));
        return { ...memoryMap };
      }
    } catch {
      // fall through
    }
  }

  memoryMap = {};
  return {};
}

function writeMap(next: MembershipMap) {
  memoryMap = { ...next };

  if (canUseLocalStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryMap));
  }

  notify();
}

export function getSchoolJoinStatus(schoolId: string): SchoolJoinStatus {
  return readMap()[schoolId] ?? 'none';
}

export function getSchoolMemberships(): MembershipMap {
  return readMap();
}

/** Instructor taps Join — request is sent and waits for school acceptance. */
export function requestSchoolJoin(schoolId: string) {
  const current = getSchoolJoinStatus(schoolId);
  if (current === 'pending' || current === 'joined') {
    return;
  }

  if (current === 'paused') {
    writeMap({
      ...readMap(),
      [schoolId]: 'joined',
    });
    return;
  }

  writeMap({
    ...readMap(),
    [schoolId]: 'pending',
  });
}

/** School accepts the join request (call when API reports acceptance). */
export function acceptSchoolJoin(schoolId: string) {
  writeMap({
    ...readMap(),
    [schoolId]: 'joined',
  });
}

export function pauseSchoolMembership(schoolId: string) {
  writeMap({
    ...readMap(),
    [schoolId]: 'paused',
  });
}

export function deactivateSchoolMembership(schoolId: string) {
  const next = readMap();
  delete next[schoolId];
  writeMap(next);
}

export function setSchoolJoinStatus(schoolId: string, status: SchoolJoinStatus) {
  if (status === 'none') {
    deactivateSchoolMembership(schoolId);
    return;
  }

  writeMap({
    ...readMap(),
    [schoolId]: status,
  });
}

export function subscribeSchoolMemberships(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getJoinButtonLabel(status: SchoolJoinStatus) {
  if (status === 'pending') {
    return 'Pending';
  }
  if (status === 'joined') {
    return 'Joined';
  }
  if (status === 'paused') {
    return 'Paused';
  }
  return 'Join';
}
