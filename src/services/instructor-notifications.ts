import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type InstructorPushNotification = Readonly<{
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string | null;
  readAt: string | null;
  inviteId: string | null;
}>;

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function listInstructorNotifications(token: string): Promise<InstructorPushNotification[]> {
  const response = await fetch(`${API_URL}/instructor/notifications`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to load notifications: ${response.status}`);
  return response.json();
}

export async function getInstructorUnreadCount(token: string): Promise<number> {
  const response = await fetch(`${API_URL}/instructor/notifications/unread-count`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to load unread count: ${response.status}`);
  const result: { count: number } = await response.json();
  return result.count;
}

export async function markInstructorNotificationRead(token: string, id: string): Promise<number> {
  const response = await fetch(`${API_URL}/instructor/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(`Failed to mark notification as read: ${response.status}`);
  const result: { count: number } = await response.json();
  return result.count;
}

export async function setIosAppIconBadge(count: number): Promise<void> {
  if (Platform.OS !== "ios") return;
  const notifications = await import("expo-notifications");
  await notifications.setBadgeCountAsync(count);
}

export async function syncIosAppIconBadge(token: string): Promise<number> {
  const count = await getInstructorUnreadCount(token);
  await setIosAppIconBadge(count);
  return count;
}
