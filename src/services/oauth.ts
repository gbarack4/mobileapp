export async function getOAuthIdToken(_provider: 'apple' | 'google'): Promise<string> {
  throw new Error('OAuth is not configured yet.');
}
