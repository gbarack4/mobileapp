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
  address: {
    line1: string;
    line2?: string | null;
    suburb: string;
    state: string;
    postcode: string;
  } | null;
  carDetails: {
    make: string;
    model: string;
    year: string;
    registration: string;
    transmission: string;
    dualControl: boolean;
  } | null;
  documents: any | null;
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
    addressLine1: string | null;
    addressLine2: string | null;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
    documents: any | null;
    car: {
      make: string;
      model: string;
      year: number;
      registrationNumber: string;
      transmission: string;
      dualControl: boolean;
    } | null;
  };
};

export type UpdatePersonalInfoDto = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string | null;
    suburb?: string;
    state?: string;
    postcode?: string;
  };
};

export type UpdateVehicleDto = {
  make?: string;
  model?: string;
  year?: string;
  registrationNumber?: string;
  transmission?: "automatic" | "manual" | "both";
  dualControl?: "yes" | "no";
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
        address: data.addressLine1
          ? {
              line1: data.addressLine1,
              line2: data.addressLine2,
              suburb: data.suburb || "",
              state: data.state || "",
              postcode: data.postcode || "",
            }
          : null,
        carDetails: data.car
          ? {
              make: data.car.make,
              model: data.car.model,
              year: String(data.car.year),
              registration: data.car.registrationNumber,
              transmission: data.car.transmission,
              dualControl: data.car.dualControl,
            }
          : null,
        documents: data.documents,
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

export async function updatePersonalInfo(
  accessToken: string,
  data: UpdatePersonalInfoDto,
): Promise<boolean> {
  if (!API_BASE_URL) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/instructors/personal-info`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update personal info: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("updatePersonalInfo error:", error);
    throw error;
  }
}

export async function updateVehicle(
  accessToken: string,
  data: UpdateVehicleDto,
): Promise<boolean> {
  if (!API_BASE_URL) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/instructors/vehicle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update vehicle: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("updateVehicle error:", error);
    throw error;
  }
}
