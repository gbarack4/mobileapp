import { getSessionEmail } from "./session";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type InstructorProfile = {
  name: string;
  initials: string;
  subtitle: string;
  phone: string;
  email: string;
  rating: number;
  vehicleSummary: string;
  avatarUrl?: string | null;
};

export type InstructorProfileApiResponse = {
  success: boolean;
  data: {
    id: string;
    userId: string;
    name: string;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    car: {
      make: string;
      model: string;
      year: number;
      transmission: string;
    } | null;
  };
};

export async function getMyProfile(
  accessToken?: string | null,
): Promise<InstructorProfile | null> {
  if (!accessToken || !API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/instructors/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = (await response.json()) as InstructorProfileApiResponse;
      const data = result.data;

      const nameParts = data.name.split(" ");
      const initials = (nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "");

      return {
        name: data.name,
        initials: initials.toUpperCase() || "I",
        subtitle: data.bio || "Driving Instructor",
        phone: data.phone || "No phone provided",
        email: getSessionEmail() || "",
        rating: 0,
        vehicleSummary: data.car
          ? `${data.car.year} ${data.car.make} ${data.car.model}`
          : "No vehicle attached",
        avatarUrl: data.avatarUrl,
      };
    }

    if (response.status === 404) {
      return null;
    }

    throw new Error("Failed to fetch profile");
  } catch (error) {
    console.error("Profile fetch error:", error);
    return null;
  }
}
