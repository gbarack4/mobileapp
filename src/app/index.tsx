import { Redirect } from 'expo-router';

import { DEV_BYPASS_AUTH } from '../constants/dev';

export default function Index() {
  // Dev bypass keeps landing on the dashboard for local UI work.
  // Normal flow starts at login / sign-in.
  return <Redirect href={DEV_BYPASS_AUTH ? '/dashboard' : '/login'} />;
}
