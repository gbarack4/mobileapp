import type { School } from "../types/school";

const AVATAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
];

const BANNER_GRADIENTS = [
  { start: "#fecaca", end: "#ef4444" },
  { start: "#fed7aa", end: "#f97316" },
  { start: "#fef08a", end: "#eab308" },
  { start: "#a7f3d0", end: "#10b981" },
  { start: "#bfdbfe", end: "#3b82f6" },
  { start: "#ddd6fe", end: "#8b5cf6" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getSchoolInitials(name: string): string {
  if (!name) return "S";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function getSchoolAvatarColor(id: string): string {
  const index = hashString(id) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getSchoolBannerColors(id: string): {
  start: string;
  end: string;
} {
  const index = hashString(id) % BANNER_GRADIENTS.length;
  return BANNER_GRADIENTS[index];
}

export function getSchoolUIData(school: School) {
  return {
    initials: getSchoolInitials(school.name),
    avatarColor: getSchoolAvatarColor(school.id),
    bannerColorStart: getSchoolBannerColors(school.id).start,
    bannerColorEnd: getSchoolBannerColors(school.id).end,
  };
}
