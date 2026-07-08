export type TransmissionType = 'automatic' | 'manual' | 'both';
export type YesNo = 'yes' | 'no';

export type DocumentType =
  | 'driverLicence'
  | 'instructorAccreditation'
  | 'insuranceCertificate'
  | 'vehicleRegistration'
  | 'workingWithChildrenCheck'
  | 'policeCheck';

export type OnboardingAddress = {
  line1: string;
  line2: string;
  suburb: string;
  state: string;
  postcode: string;
};

export const EMPTY_ONBOARDING_ADDRESS: OnboardingAddress = {
  line1: '',
  line2: '',
  suburb: '',
  state: '',
  postcode: '',
};

export type OnboardingForm = {
  profilePhotoUri: string | null;
  profilePhotoName: string | null;
  dateOfBirth: string;
  address: OnboardingAddress;
  emergencyContactName: string;
  emergencyContactPhone: string;
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
  dateOfBirth: '',
  address: { ...EMPTY_ONBOARDING_ADDRESS },
  emergencyContactName: '',
  emergencyContactPhone: '',
  driverLicenceNumber: '',
  driverLicenceExpiry: '',
  instructorAccreditationNumber: '',
  accreditationExpiry: '',
  yearsOfExperience: '',
  transmissionType: null,
  languagesSpoken: '',
  bio: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  registrationNumber: '',
  vehicleTransmission: null,
  dualControlVehicle: null,
  documents: {
    driverLicence: null,
    instructorAccreditation: null,
    insuranceCertificate: null,
    vehicleRegistration: null,
    workingWithChildrenCheck: null,
    policeCheck: null,
  },
};
