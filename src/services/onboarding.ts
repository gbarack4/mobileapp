import type { OnboardingAddress } from '../types/onboarding';

export type SavePersonalInfoPayload = {
  profilePhotoUri: string | null;
  profilePhotoName: string | null;
  dateOfBirth: string | null;
  address: OnboardingAddress;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export async function savePersonalInfo(payload: SavePersonalInfoPayload): Promise<void> {
  // TODO: POST /instructors/onboarding/personal — upload photo + persist fields via NestJS API
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (__DEV__) {
    console.info('[onboarding] savePersonalInfo', payload);
  }
}
