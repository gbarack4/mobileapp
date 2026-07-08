export type SchoolStripeStatus = 'connected' | 'not_connected' | 'pending';

export type SchoolStripeConnection = {
  schoolId: string;
  name: string;
  initials: string;
  avatarColor: string;
  stripeStatus: SchoolStripeStatus;
  stripeAccountLabel?: string;
};
