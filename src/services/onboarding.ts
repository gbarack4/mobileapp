const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!baseUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

export type OnboardingDraft = {
  currentStepIndex: number;
  formData: Record<string, any>;
};

export async function getOnboardingDraft(
  token: string,
): Promise<OnboardingDraft> {
  const response = await fetch(`${baseUrl}/instructors/onboarding/draft`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch onboarding draft");
  }

  return response.json();
}

export async function saveOnboardingDraft(
  payload: { currentStepIndex: number; formData: Record<string, any> },
  token: string,
): Promise<void> {
  const response = await fetch(`${baseUrl}/instructors/onboarding/draft`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to autosave onboarding draft");
  }
}

export async function submitFinalOnboarding(
  payload: Record<string, any>,
  token: string,
): Promise<void> {
  const response = await fetch(`${baseUrl}/instructors/onboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to complete onboarding");
  }
}
