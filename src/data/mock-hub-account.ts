export type HubQuickLinkId = 'personal-info' | 'security' | 'privacy-data';

export type HubAccountProfile = {
  name: string;
  initials: string;
  email: string;
  rating: number;
};

export type HubSettingItem = {
  id: string;
  label: string;
  value?: string;
  subtitle?: string;
  toggle?: boolean;
  enabled?: boolean;
  destructive?: boolean;
};

export type HubSettingsSection = {
  title?: string;
  rows: HubSettingItem[];
};

export const MOCK_HUB_ACCOUNT: HubAccountProfile = {
  name: 'George',
  initials: 'H',
  email: 'georged@outlook.com.au',
  rating: 4.8,
};

export const HUB_QUICK_LINKS: { id: HubQuickLinkId; label: string }[] = [
  { id: 'personal-info', label: 'Personal info' },
  { id: 'security', label: 'Security' },
  { id: 'privacy-data', label: 'Privacy & data' },
];

export type HubDocumentStatus = 'uploaded' | 'required' | 'expiring';

export type HubDocumentItem = {
  id: string;
  label: string;
  status: HubDocumentStatus;
  detail?: string;
  fileName?: string;
};

export const MOCK_HUB_DOCUMENTS: HubDocumentItem[] = [
  {
    id: 'licence',
    label: 'Driver licence',
    status: 'uploaded',
    fileName: 'driver-licence.pdf',
  },
  {
    id: 'wwcc',
    label: 'Working with children check',
    status: 'expiring',
    detail: 'Expires in 30 days',
    fileName: 'wwcc-certificate.pdf',
  },
  {
    id: 'police-check',
    label: 'Police check',
    status: 'required',
    detail: 'Upload required',
  },
  {
    id: 'insurance',
    label: 'Insurance certificate',
    status: 'uploaded',
    fileName: 'insurance-2026.pdf',
  },
];

export function getHubDocumentsNeedingAction(documents: HubDocumentItem[]) {
  return documents.filter((document) => document.status !== 'uploaded');
}

export const HUB_PERSONAL_INFO_SECTIONS: HubSettingsSection[] = [
  {
    title: 'Basic info',
    rows: [
      { id: 'name', label: 'Name', value: 'George' },
      { id: 'email', label: 'Email', value: 'georged@outlook.com.au' },
      { id: 'phone', label: 'Phone', value: '+61 412 345 678' },
    ],
  },
  {
    title: 'Contact info',
    rows: [
      { id: 'address', label: 'Address', value: 'Brisbane, QLD 4000' },
      {
        id: 'emergency',
        label: 'Emergency contact',
        value: 'Jane Doe',
        subtitle: '+61 498 765 432',
      },
    ],
  },
];

export const HUB_SECURITY_SECTIONS: HubSettingsSection[] = [
  {
    title: 'Signing in to InstructorHub',
    rows: [
      { id: 'password', label: 'Password', value: 'Last changed 3 months ago' },
      { id: '2sv', label: '2-Step Verification', value: 'On since 12 Jan 2025' },
      { id: 'recovery-email', label: 'Recovery email', value: 'georged@outlook.com.au' },
    ],
  },
  {
    title: 'Recent security activity',
    rows: [
      { id: 'devices', label: 'Your devices', value: '2 devices' },
      { id: 'sign-in-activity', label: 'Recent sign-in activity' },
    ],
  },
];

export const HUB_PRIVACY_SECTIONS: HubSettingsSection[] = [
  {
    title: 'Privacy settings',
    rows: [
      { id: 'profile-visibility', label: 'Profile visibility', value: 'Schools only' },
      {
        id: 'location-sharing',
        label: 'Location sharing',
        subtitle: 'Share location during active lessons',
        toggle: true,
        enabled: true,
      },
      {
        id: 'analytics',
        label: 'Usage analytics',
        subtitle: 'Help improve InstructorHub with anonymous data',
        toggle: true,
        enabled: false,
      },
    ],
  },
  {
    title: 'Data & privacy',
    rows: [
      { id: 'download-data', label: 'Download your data' },
      { id: 'ads', label: 'Ad settings', value: 'Off' },
      { id: 'delete-account', label: 'Delete Hub account', destructive: true },
    ],
  },
];
