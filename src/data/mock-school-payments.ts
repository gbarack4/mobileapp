import { MOCK_ACTIVE_SCHOOLS } from './mock-active-schools';
import type { SchoolStripeConnection } from '../types/payment';

// TODO: connect to NestJS Stripe Connect API
export const MOCK_SCHOOL_STRIPE_CONNECTIONS: SchoolStripeConnection[] = MOCK_ACTIVE_SCHOOLS.map(
  (school, index) => ({
    schoolId: school.id,
    name: school.name,
    initials: school.initials,
    avatarColor: school.avatarColor,
    stripeStatus: index === 0 ? 'connected' : 'not_connected',
    stripeAccountLabel: index === 0 ? '•••• 4821' : undefined,
  }),
);

export function getConnectedSchoolCount(connections: SchoolStripeConnection[]) {
  return connections.filter((connection) => connection.stripeStatus === 'connected').length;
}
