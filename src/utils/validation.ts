const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s().-]{7,}$/;

export function isValidIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return true;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  return PHONE_REGEX.test(trimmed) && digitsOnly.length >= 7;
}

export function normalizeIdentifier(value: string): string {
  return value.trim();
}

export function isValidPassword(value: string): boolean {
  return value.trim().length >= 8;
}
