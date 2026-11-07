export type TransmissionType = "automatic" | "manual" | "both";

export type YesNo = "yes" | "no";

export type DocumentType =
  | "driverLicence"
  | "instructorAccreditation"
  | "vehicleRegistration"
  | "workingWithChildrenCheck";

export type OnboardingAddress = {
  line1: string;
  line2: string;
  suburb: string;
  state: string;
  postcode: string;
};

export const EMPTY_ONBOARDING_ADDRESS: OnboardingAddress = {
  line1: "",
  line2: "",
  suburb: "",
  state: "",
  postcode: "",
};

export type OnboardingForm = {  
  profilePhotoUri: string | null;
  profilePhotoName: string | null; 
  address: OnboardingAddress;
  driverLicenceNumber: string;
  driverLicenceExpiry: string;
  instructorAccreditationNumber: string;
  accreditationExpiry: string;
  yearsOfExperience: string;
  transmissionType: TransmissionType | null;
  languagesSpoken: string;
  bio: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  registrationNumber: string;
  vehicleTransmission: TransmissionType | null;
  dualControlVehicle: YesNo | null;
  documents: Record<DocumentType, string | null>;
};

export const INITIAL_ONBOARDING_FORM: OnboardingForm = {  
  profilePhotoUri: null,
  profilePhotoName: null, 
  address: { ...EMPTY_ONBOARDING_ADDRESS },
  driverLicenceNumber: "",
  driverLicenceExpiry: "",
  instructorAccreditationNumber: "",
  accreditationExpiry: "",
  yearsOfExperience: "",
  transmissionType: null,
  languagesSpoken: "",
  bio: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  registrationNumber: "",
  vehicleTransmission: null,
  dualControlVehicle: null,
  documents: {
    driverLicence: null,
    instructorAccreditation: null,
    vehicleRegistration: null,
    workingWithChildrenCheck: null,
  },
};

/** Fields the onboard/draft APIs must never receive. */
const REMOVED_ONBOARDING_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
] as const;

/**
 * Pick only known onboarding form fields from draft/API data.
 * Prevents removed fields (and other unknowns) from leaking into state.
 */
export function sanitizeOnboardingFormData(
  raw: Partial<OnboardingForm> | Record<string, unknown> | null | undefined,
): Partial<OnboardingForm> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const addressRaw =
    source.address && typeof source.address === "object"
      ? (source.address as Record<string, unknown>)
      : null;
  const documentsRaw =
    source.documents && typeof source.documents === "object"
      ? (source.documents as Record<string, unknown>)
      : null;

  const sanitized: Partial<OnboardingForm> = {};

  if (typeof source.profilePhotoUri === "string" || source.profilePhotoUri === null) {
    sanitized.profilePhotoUri = source.profilePhotoUri as string | null;
  }
  if (
    typeof source.profilePhotoName === "string" ||
    source.profilePhotoName === null
  ) {
    sanitized.profilePhotoName = source.profilePhotoName as string | null;
  }

  if (addressRaw) {
    sanitized.address = {
      line1: typeof addressRaw.line1 === "string" ? addressRaw.line1 : "",
      line2: typeof addressRaw.line2 === "string" ? addressRaw.line2 : "",
      suburb: typeof addressRaw.suburb === "string" ? addressRaw.suburb : "",
      state: typeof addressRaw.state === "string" ? addressRaw.state : "",
      postcode:
        typeof addressRaw.postcode === "string" ? addressRaw.postcode : "",
    };
  }

  const stringFields = [
    "driverLicenceNumber",
    "driverLicenceExpiry",
    "instructorAccreditationNumber",
    "accreditationExpiry",
    "yearsOfExperience",
    "languagesSpoken",
    "bio",
    "vehicleMake",
    "vehicleModel",
    "vehicleYear",
    "registrationNumber",
  ] as const;

  for (const key of stringFields) {
    if (typeof source[key] === "string") {
      sanitized[key] = source[key] as string;
    }
  }

  if (
    source.transmissionType === "automatic" ||
    source.transmissionType === "manual" ||
    source.transmissionType === "both" ||
    source.transmissionType === null
  ) {
    sanitized.transmissionType = source.transmissionType;
  }

  if (
    source.vehicleTransmission === "automatic" ||
    source.vehicleTransmission === "manual" ||
    source.vehicleTransmission === "both" ||
    source.vehicleTransmission === null
  ) {
    sanitized.vehicleTransmission = source.vehicleTransmission;
  }

  if (
    source.dualControlVehicle === "yes" ||
    source.dualControlVehicle === "no" ||
    source.dualControlVehicle === null
  ) {
    sanitized.dualControlVehicle = source.dualControlVehicle;
  }

  if (documentsRaw) {
    sanitized.documents = {
      driverLicence:
        typeof documentsRaw.driverLicence === "string"
          ? documentsRaw.driverLicence
          : null,
      instructorAccreditation:
        typeof documentsRaw.instructorAccreditation === "string"
          ? documentsRaw.instructorAccreditation
          : null,
      vehicleRegistration:
        typeof documentsRaw.vehicleRegistration === "string"
          ? documentsRaw.vehicleRegistration
          : null,
      workingWithChildrenCheck:
        typeof documentsRaw.workingWithChildrenCheck === "string"
          ? documentsRaw.workingWithChildrenCheck
          : null,
    };
  }

  for (const key of REMOVED_ONBOARDING_FIELDS) {
    delete (sanitized as Record<string, unknown>)[key];
  }

  return sanitized;
}

/**
 * Explicit API payload for draft save / final onboard.
 * Never includes firstName, lastName, dateOfBirth, or local photo URI fields.
 */
export function toOnboardingApiPayload(form: OnboardingForm): Record<string, unknown> {
  return {
    address: {
      line1: form.address.line1.trim(),
      line2: form.address.line2.trim() || undefined,
      suburb: form.address.suburb.trim(),
      state: form.address.state.trim(),
      postcode: form.address.postcode.trim(),
    },
    driverLicenceNumber: form.driverLicenceNumber.trim(),
    driverLicenceExpiry: form.driverLicenceExpiry.trim(),
    instructorAccreditationNumber: form.instructorAccreditationNumber.trim(),
    accreditationExpiry: form.accreditationExpiry.trim(),
    yearsOfExperience: form.yearsOfExperience.trim(),
    transmissionType: form.transmissionType,
    languagesSpoken: form.languagesSpoken.trim(),
    bio: form.bio.trim(),
    vehicleMake: form.vehicleMake.trim(),
    vehicleModel: form.vehicleModel.trim(),
    vehicleYear: form.vehicleYear.trim(),
    registrationNumber: form.registrationNumber.trim(),
    vehicleTransmission: form.vehicleTransmission,
    dualControlVehicle: form.dualControlVehicle,
    documents: {
      driverLicence: form.documents.driverLicence,
      instructorAccreditation: form.documents.instructorAccreditation,
      vehicleRegistration: form.documents.vehicleRegistration,
      workingWithChildrenCheck: form.documents.workingWithChildrenCheck,
    },
  };
}
