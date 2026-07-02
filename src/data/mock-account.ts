export type InstructorProfile = {
  name: string;
  initials: string;
  subtitle: string;
  vehicleSummary: string;
};

export const MOCK_INSTRUCTOR_PROFILE: InstructorProfile = {
  name: 'Hb',
  initials: 'H',
  subtitle: 'Driving Instructor · ADI Certified',
  vehicleSummary: 'Ford Focus · AB21 XYZ',
};

export type AccountMenuItem = {
  id: string;
  label: string;
  subtitle?: string;
};

export const ACCOUNT_MENU_SECTION_1: AccountMenuItem[] = [
  { id: 'vehicles', label: 'Vehicles', subtitle: MOCK_INSTRUCTOR_PROFILE.vehicleSummary },
  { id: 'documents', label: 'Documents' },
  { id: 'payment', label: 'Payment' },
  { id: 'availability', label: 'Availability' },
];

export const ACCOUNT_MENU_SECTION_2: AccountMenuItem[] = [
  { id: 'manage-account', label: 'Manage Hub account' },
  { id: 'edit-address', label: 'Edit Address' },
  { id: 'insurance', label: 'Insurance' },
];

export const ACCOUNT_MENU_SECTION_3: AccountMenuItem[] = [
  { id: 'privacy', label: 'Privacy' },
  { id: 'app-settings', label: 'App Settings' },
  { id: 'about', label: 'About' },
];
