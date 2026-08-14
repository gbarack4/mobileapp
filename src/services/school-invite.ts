import type { SchoolInvite } from "../types/school-invite";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function getInstructorInvites(
  token: string | null,
): Promise<SchoolInvite[]> {
  const response = await fetch(`${API_URL}/instructor/invites`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch invites: ${response.statusText}`);
  }

  return response.json();
}

export async function getSchoolInvite(
  id: string,
  token: string | null,
): Promise<SchoolInvite> {
  const invites = await getInstructorInvites(token);
  const invite = invites.find((i) => i.id === id);

  if (!invite) {
    throw new Error("Invite not found");
  }

  return invite;
}

export async function acceptSchoolInvite(
  id: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_URL}/instructor/invites/${id}/accept`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to accept invite: ${response.statusText}`);
  }
}

export async function declineSchoolInvite(
  id: string,
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_URL}/instructor/invites/${id}/decline`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to decline invite: ${response.statusText}`);
  }
}
