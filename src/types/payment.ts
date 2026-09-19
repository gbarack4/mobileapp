export type PayoutConnectionStatus =
  | "not_connected"
  | "pending"
  | "connected"
  | "disconnected";

export type SchoolStripeConnection = {
  schoolId: string;
  name: string;
  initials: string;
  avatarColor: string;
  stripeStatus: PayoutConnectionStatus;
  stripeAccountLabel?: string;
};

export type InstructorStripeSchool = {
  schoolId: string;
  name: string;
  payoutConnectionStatus: PayoutConnectionStatus;
};

export type StripeConnectionStatusResponse = {
  stripeAccountId: string | null;
  payoutConnectionStatus: PayoutConnectionStatus;
};

export type StripeConnectionResponse = StripeConnectionStatusResponse & {
  url: string | null;
};
