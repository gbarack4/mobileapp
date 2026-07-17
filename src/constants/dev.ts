/**
 * When true, skip Clerk sign-in / role checks so the dashboard can be edited locally.
 * Only enable via EXPO_PUBLIC_DEV_BYPASS_AUTH=true in .env — never in production.
 */
export const DEV_BYPASS_AUTH =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';
