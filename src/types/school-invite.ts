export type SchoolInvite = {
  id: string;
  schoolName: string;
  schoolInitials: string;
  schoolAvatarColor: string;
  schoolSuburb: string;
  schoolAddress: string;
  invitedByName: string;
  invitedByRole: string;
  message?: string;
  expiresAtLabel?: string;
};

export const MOCK_SCHOOL_INVITE: SchoolInvite = {
  id: "invite-demo-1",
  schoolName: "Precision Driving School",
  schoolInitials: "PD",
  schoolAvatarColor: "#f97316",
  schoolSuburb: "Parramatta",
  schoolAddress: "42 Church St",
  invitedByName: "Sarah Mitchell",
  invitedByRole: "School admin",
  message:
    "We’d love you to join our instructor team. Accept to start receiving bookings from our school.",
  expiresAtLabel: "Expires in 7 days",
};
