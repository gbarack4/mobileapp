export type SchoolStripeStatus =
  | "connected"
  | "not_connected"
  | "pending"
  | "disconnected";

export type SchoolStripeConnection = {
  schoolId: string;
  name: string;
  initials: string;
  avatarColor: string;
  stripeStatus: SchoolStripeStatus;
  stripeAccountLabel?: string;
};

export type PayoutConnectionStatus =
  | "not_connected"
  | "pending"
  | "connected"
  | "disconnected";

export type StripeRecipientStatus =
  | "active"
  | "pending"
  | "restricted"
  | "unsupported"
  | null;

export type InstructorStripeSchool = {
  schoolId: string;
  name: string;
  payoutConnectionStatus: PayoutConnectionStatus;
  stripeRecipientStatus: StripeRecipientStatus;
};

export type StripeOnboardingResponse = {
  url: string;
};

export type StripeConnectionStatusResponse = {
  status: PayoutConnectionStatus;
  stripeStatus: StripeRecipientStatus;
};

export type StripeReconnectResponse = StripeConnectionStatusResponse & {
  url: string | null;
};
